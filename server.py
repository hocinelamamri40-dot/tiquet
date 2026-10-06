from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent / 'public'), **kwargs)

if __name__ == '__main__':
    print('Application : http://localhost:5000', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 5000), Handler).serve_forever()
