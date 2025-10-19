# Tirelire — Documentation Technique

Description
-----------
Tirelire est une API Node.js/Express destinée à gérer des groupes de contribution (tirelires),
la gestion des utilisateurs, KYC (vérification d'identité), paiements, messages, tickets et
fonctions de fiabilité (reliability scoring). Le projet utilise MongoDB/Mongoose pour la persistance
des données, JWT pour l'authentification et des services tiers (Stripe, face-api.js) pour
les paiements et la détection faciale.

Structure du projet
-------------------
- `src/` — code source principal
	- `controllers/` — couche HTTP handlers
	- `services/` — logique métier (interaction avec modèles et API externes)
	- `models/` — schémas Mongoose
	- `routes/` — définition des routes express
	- `middleware/` — middlewares (auth, validation, error handling)
	- `config/` — configuration et initialisation (connexion DB, app settings)
	- `utils/` — utilitaires (chargement de modèles face-api etc.)
- `tests/` — petits tests d'intégration / smoke tests (fichier `routes.test.js`)
- `face-api/` — modèles ML (généralement volumineux, à stocker hors dépôt si possible)

Principales dépendances
-----------------------
- express — serveur HTTP
- mongoose — ORM MongoDB
- jsonwebtoken — gestion des JWT
- bcryptjs — hash des mots de passe
- dotenv — chargement des variables d'environnement
- stripe — intégration paiements
- face-api.js / canvas — détection faciale (optionnelle)

Variables d'environnement
------------------------
Créez un fichier `.env` à la racine avec ces variables minimales :

```
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/tirelireDB
PORT=5000
STRIPE_SECRET_KEY=sk_test_...
```

Commandes utiles
----------------
- Installer les dépendances :

```powershell
npm install
```

- Démarrer en développement (nodemon) :

```powershell
npm run dev
```

- Démarrer en production :

```powershell
npm start
```

- Lancer les tests légers (smoke tests) :

```powershell
node tests/routes.test.js
```

API — Aperçu des endpoints
--------------------------
Base URL : `http://localhost:<PORT>/api/v1`

Auth
- POST `/auth/register` — enregistre un utilisateur
- POST `/auth/login` — authentifie et renvoie un JWT
- GET `/auth/profile` — profil utilisateur (protégé)

Groups
- GET `/groups` — récupérer les groupes de l'utilisateur (protégé)
- POST `/groups` — créer un groupe (protégé)
- GET `/groups/:groupId` — détails d'un groupe
- PUT `/groups/:groupId` — mettre à jour
- DELETE `/groups/:groupId` — supprimer

Payments
- POST `/payments/intent` — créer un intent (Stripe)
- GET `/payments` — lister paiements de l'utilisateur

KYC
- POST `/kyc` — soumettre KYC (images/base64)
- GET `/kyc/me` — récupérer KYC de l'utilisateur

Messages
- POST `/messages/group/:groupId` — poster un message dans un groupe
- GET `/messages/group/:groupId` — lister les messages d'un groupe

Tickets
- POST `/tickets` — créer un ticket
- GET `/tickets` — lister tickets
- POST `/tickets/:ticketId/response` — ajouter une réponse

Sécurité et bonnes pratiques
---------------------------
- Ne laissez pas de clés secrètes en dur dans le code. Utilisez `.env` et validez les variables en production.
- Ne commitez pas les modèles volumineux `face-api` — stockez-les dans un stockage d'artefacts.
- Activez HTTPS en production et réglez correctement les cookies/sessions si ajoutés.

Tests
-----
Un fichier léger de tests d'API (`tests/routes.test.js`) est fourni. Il effectue des tests "smoke" qui
stubent les services et s'assurent que les controllers appellent correctement les services.

Pour exécuter :

```powershell
node tests/routes.test.js
```

Débogage & dépannage
---------------------
- Erreur `Cannot find module 'cors'` : `npm install cors`.
- Erreurs de connexion MongoDB : vérifiez que MongoDB tourne (`mongod`) et que `MONGODB_URI` est correct.
- Erreurs `Schema hasn't been registered for model "X"` : assurez-vous que le fichier modèle correspondant existe
	et qu'il est importé avant utilisation (ou créez un modèle stub si nécessaire lors des tests).

Prochaines améliorations recommandées
------------------------------------
- Ajouter un runner de tests (mocha/jest) et des tests unitaires structurés.
- Ajouter un fichier `docker-compose.yml` ou images Docker pour faciliter le déploiement local.
- Remplacer `console.log` par un logger structuré (winston/pino) et gérer les niveaux (info/error).
- Ajouter CI (GitHub Actions) pour exécuter tests et lint sur push/PR.

Contact
-------
Pour toute question sur le code : Omar Bourra

---
Fichier généré automatiquement : README technique minimal pour le projet Tirelire.
