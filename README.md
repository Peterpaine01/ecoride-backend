# Ecoride Backend

## Description

Ecoride est une plateforme de covoiturage conçue pour faciliter les trajets entre particuliers tout en adoptant une approche éco-responsable. Ce backend repose sur Node.js avec Express.js, et utilise une architecture hybride SQL/NoSQL pour optimiser la gestion des données.

## Stack Technique

- **Node.js avec Express.js** pour gérer l’API REST.
- **MySQL** pour la gestion des utilisateurs, véhicules, préférences et statistiques.
- **MongoDB** pour la gestion des trajets, réservations et évaluations.
- **JSON Web Tokens (JWT)** pour l’authentification sécurisée.
- **Cloudinary** pour l’hébergement et l’optimisation des images.
- **Yarn** pour la gestion des dépendances.

## Installation et Configuration

### Prérequis

- Node.js installé (version 16 ou supérieure recommandée).
- MySQL et MongoDB installés et configurés.
- Un compte Cloudinary pour la gestion des images.

### Installation

1. Cloner le dépôt :

   ```bash
   git clone https://github.com/votre-repo/ecoride-backend.git
   cd ecoride-backend

   ```

2. Installer les dépendances :

   ```bash
    yarn install
   ```

3. Configurer les variables d’environnement

Créer un fichier `.env` à la racine et y ajouter :

```ini
MONGO_URI=mongodb://localhost:27017/ecoride
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=3000
JWT_KEY=your_secret_key
BACK_URL=http://localhost:5000
FRONT_URL=http://localhost:3000
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=ecoride_db
MYSQL_PORT=35920
```

4. Lancer le serveur

- En mode développement :

  ```bash
  yarn dev
  ```

- En mode production :

  ```bash
  yarn start
  ```

### Fonctionnalités Principales

- Gestion des utilisateurs : Inscription, connexion sécurisée, mise à jour du profil.
- Gestion des trajets et réservations : Création, modification et consultation des trajets en temps réel.
- Évaluations et feedback : Les passagers peuvent laisser des avis aux conducteurs.
- Statistiques et performances : Historisation des bénéfices journaliers pour suivi de la rentabilité.
- Gestion des images : Recadrage et compression via Sharp avant envoi sur Cloudinary.
- Notifications par e-mail : Confirmation de réservation via Nodemailer et Mailgun.

### Structure du Projet

/ecoride-backend
│── /src
│ ├── /config # Configuration des bases de données et services
│ ├── /controllers # Logique métier
│ ├── /models # Schémas SQL et MongoDB
│ ├── /routes # Définition des endpoints API
│ ├── /middlewares # Middleware d’authentification et validation
│ ├── /utils # Fonctions utilitaires
│ └── /services # Logique métier
└── .env # Variables d’environnement
├── index.js # Point d’entrée de l’application

### API Endpoints

#### Authentification

- POST /login → Connexion utilisateur.
- GET /user/verify/:token → Vérifier le compte.

#### User

- POST /create-user → Créer un utilisateur.
- GET /user/:id → Détails d'un utilisateur.
- GET /users → Liste des utilisateur
- PUT /update-user/:id → Modifier un utilisateur

#### Rides

- POST /create-ride
- GET /ride/:id
- PUT /update-ride/:id
- GET /driver-rides
- GET /search-rides
- DELETE /delete-ride/:id

#### Bookings

- POST /create-booking/:id
- GET /booking/:id
- PUT /update-booking/:id
- GET /delete-booking/:id

#### Reviews

- POST /create-review/:id
- GET /reviews-driver/:id
- PUT /update-review/:id
- GET /reviews-summary/:id

#### Cars

- POST /create-car
- GET /car/:id
- GET /user-cars/:id
- PUT /update-car/:id
- DELETE /delete-car/:id

### Sécurité et Performances

- Authentification avec JWT pour protéger les endpoints sensibles.
- Validation des entrées avec Express-validator pour éviter les injections SQL et XSS.
- CORS activé pour gérer les accès cross-origin.
- Compression des images avec Sharp pour réduire l’espace de stockage et accélérer le chargement.

### Licence

Ce projet est sous licence MIT. Vous êtes libre de l’utiliser et de le modifier selon vos besoins.
