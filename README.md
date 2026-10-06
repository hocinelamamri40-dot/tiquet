# Suivi des tickets HI Rungis

Application statique HTML, CSS et JavaScript, compatible avec Vercel sans API ni installation.

## Vercel

Importer ce dépôt avec Framework Preset : Other. Le fichier `vercel.json` configure le dossier de sortie `public` sans commande de build. Si le projet Vercel possède des réglages manuels, choisir Root Directory : racine du dépôt, Output Directory : public, et aucune commande de build. Redéployer après le push.

## Connexion

Utilisateur : `admin`. Mot de passe : `admin`. Connexion d'interface uniquement : les identifiants sont dans le JavaScript et le JSON est public, comme demandé. La session est conservée dans l'onglet jusqu'à la déconnexion ou sa fermeture.

## Tickets

Les données initiales sont dans `public/tickets.json`. Recherche, filtres, ajout, modification, suppression, export JSON et téléchargement direct du PDF fonctionnent dans le navigateur.

Les modifications sont enregistrées dans le stockage local du navigateur. Elles ne sont pas synchronisées entre ordinateurs et ne modifient pas le fichier sur GitHub. Exportez le JSON pour sauvegarder vos modifications. Pour publier une nouvelle version des données pour tous, remplacez `public/tickets.json` puis redéployez. Les navigateurs ayant déjà des modifications locales conservent leur copie jusqu'à l'effacement des données du site.

## Local

Lancer `python server.py`, puis ouvrir http://localhost:5000. Python sert uniquement les fichiers statiques et n'est pas utilisé par Vercel.

Les archives Excel et la sauvegarde d'origine restent dans `data`. L'import Excel existant écrit dans `data/tickets.json` : copier ensuite ce fichier vers `public/tickets.json` pour mettre à jour les données publiées.
