# Suivi des tickets HI Rungis

Lancer `python server.py`, puis ouvrir http://localhost:5000.

Connexion : utilisateur `admin`, mot de passe `admin`. La session expire après 8 heures et se termine au redémarrage du serveur. Le bouton Déconnexion ferme la session.

Les tickets de l’onglet SUIVI CURATIF sont dans `data/tickets.json`. Les autres onglets et toutes les valeurs d’origine sont conservés dans `data/excel_archive.json`. Aucun moteur de base de données. Les écritures sont atomiques et sérialisées par le serveur. Un statut Excel vide est affiché « Ouvert ». Les tickets clos sont conservés et accessibles via le filtre.

L’application permet de consulter, ajouter, modifier et supprimer les tickets, de changer les dates, de rechercher et filtrer, et de télécharger le JSON. Sauvegardez régulièrement le dossier `data`. Application locale, accessible uniquement depuis cet ordinateur.

L’import initial utilise openpyxl : `python import_excel.py "chemin du fichier.xlsx"`. Il refuse d’écraser les tickets existants.

Récapitulatif : choisissez les filtres puis cliquez sur Télécharger le PDF. Le fichier est téléchargé directement, avec tous les tickets filtrés, les totaux par statut et les commentaires.

Les dates et mentions de 2025 des tickets actifs ont été passées en 2026. Sauvegarde : `data/tickets.before-2026.json`. Les dates Excel originales et `excel_archive.json` sont conservées.
