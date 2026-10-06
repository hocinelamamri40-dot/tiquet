import json, os, re, threading, secrets, time
from http.cookies import SimpleCookie
from datetime import date, datetime
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

ROOT = Path(__file__).parent
DATA = ROOT / 'data' / 'tickets.json'
LOCK = threading.Lock()
SESSIONS = {}
SESSION_LOCK = threading.Lock()
def read():
    return json.loads(DATA.read_text(encoding='utf-8'))
def save(tickets):
    temp = DATA.with_suffix('.tmp')
    temp.write_text(json.dumps(tickets, ensure_ascii=False, indent=2), encoding='utf-8')
    os.replace(temp, DATA)
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'public'), **kwargs)
    def respond(self, status, data, cookie=None):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(body)
    def session_token(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get('Cookie', ''))
            return cookie['session'].value if 'session' in cookie else ''
        except Exception:
            return ''
    def authenticated(self):
        with SESSION_LOCK:
            now = time.time()
            for token in list(SESSIONS):
                if SESSIONS[token] <= now:
                    del SESSIONS[token]
            return self.session_token() in SESSIONS
    def redirect_login(self):
        self.send_response(302)
        self.send_header('Location', '/login.html')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', '0')
        self.end_headers()
    def do_GET(self):
        path = urlparse(self.path).path
        if path not in ('/login.html', '/login.js', '/style.css', '/favicon.ico') and not self.authenticated():
            if path.startswith('/api/'):
                return self.respond(401, {'error':'Connexion requise'})
            return self.redirect_login()
        if path == '/api/tickets':
            with LOCK:
                self.respond(200, read())
        else:
            super().do_GET()
    def mutate(self):
        path = urlparse(self.path).path
        if self.command == 'POST' and path == '/api/login':
            try:
                length = int(self.headers.get('Content-Length', 0))
                if not 0 < length < 4096:
                    raise ValueError()
                payload = json.loads(self.rfile.read(length))
                if not isinstance(payload, dict):
                    raise ValueError()
                if payload.get('username') != 'admin' or payload.get('password') != 'admin':
                    return self.respond(401, {'error':'Identifiants incorrects'})
                token = secrets.token_urlsafe(32)
                with SESSION_LOCK:
                    SESSIONS.pop(self.session_token(), None)
                    SESSIONS[token] = time.time() + 8 * 3600
                return self.respond(200, {'ok':True}, f'session={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800')
            except (ValueError, TypeError):
                return self.respond(400, {'error':'Contenu invalide'})
        if not self.authenticated():
            return self.respond(401, {'error':'Connexion requise'})
        if self.headers.get('Sec-Fetch-Site') == 'cross-site':
            return self.respond(403, {'error':'Requête refusée'})
        if self.command == 'POST' and path == '/api/logout':
            with SESSION_LOCK:
                SESSIONS.pop(self.session_token(), None)
            return self.respond(200, {'ok':True}, 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
        if not re.fullmatch(r'/api/tickets(?:/TKT-\d+)?', path):
            return self.respond(404, {'error':'Adresse inconnue'})
        try:
            with LOCK:
                tickets = read()
                identifier = path.split('/')[-1] if path != '/api/tickets' else None
                existing = next((t for t in tickets if t['id']==identifier), None)
                if self.command != 'POST' and existing is None:
                    return self.respond(404, {'error':'Ticket introuvable'})
                if self.command == 'DELETE':
                    tickets.remove(existing)
                    save(tickets)
                    return self.respond(200, {'ok':True})
                if self.command == 'POST' and identifier:
                    return self.respond(405, {'error':'Méthode incorrecte'})
                length = int(self.headers.get('Content-Length', 0))
                if not 0 < length < 100000:
                    raise ValueError('Contenu invalide')
                payload = json.loads(self.rfile.read(length))
                fields = {}
                for key in ('equipment','type','title','date','comment','status'):
                    val = payload.get(key, '')
                    if not isinstance(val, str):
                        raise ValueError('Champ invalide : '+key)
                    fields[key] = val.strip()
                if not fields['equipment'] or not fields['title'] or not fields['status']:
                    raise ValueError('Équipement, motif et statut obligatoires')
                if fields['date']:
                    date.fromisoformat(fields['date'])
                if existing:
                    existing.update(fields)
                    result = existing
                else:
                    number = max((int(t['id'].split('-')[1]) for t in tickets), default=0)+1
                    result = dict(id=f'TKT-{number:04}', **fields)
                    tickets.append(result)
                result['updatedAt'] = datetime.now().isoformat()
                save(tickets)
                self.respond(201 if self.command=='POST' else 200, result)
        except (ValueError, TypeError) as error:
            self.respond(400, {'error':str(error)})
        except Exception:
            self.respond(500, {'error':'Impossible de lire ou enregistrer le fichier JSON'})
    do_POST = mutate
    do_PUT = mutate
    do_DELETE = mutate
if __name__ == '__main__':
    print('Application : http://localhost:5000', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 5000), Handler).serve_forever()
