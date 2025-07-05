# SoloQ Challenge Website

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Last Commit](https://img.shields.io/github/last-commit/ton-utilisateur/ton-repo)
![Main Language](https://img.shields.io/github/languages/top/ton-utilisateur/ton-repo)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Express%20%7C%20MongoDB-blue)

Plateforme pour suivre le SoloQ Challenge League of Legends entre amis.  

## ✨ Fonctionnalités

- Tableau des joueurs : Suivi détaillé de l’état et des statistiques de chaque participant
- Podium des équipes : Visualisation du classement par équipe
- Historique des parties : Récapitulatif des dernières games jouées par les challengers
- Mode sombre : Interface dark mode activable via un bouton
- Interface réactive : Adaptée à tous types d’écrans (responsive design)

## ⚙️Stack technique
- Node.js (Backend)
- React/Vite (Frontend)
- PostgreSQL (DB)
- Docker & Docker-compose (DevOps)

## 📦 Structure du projet

```sh
.
├── backend/          # API Node.js
├── frontend/         # App React/Vite
├── docker-compose.yml # Configuration Docker
└── ...
```


## 🚀 Premiers pas

### Prérequis
- Docker + Docker Compose
- Node.js 20+

### Installation
1. Fork ce repository
2. Clone ton fork :
```bash
git clone https://github.com/ton-username/soloq-challenge.git
cd soloq-challenge
```
3. Configurer les variables d'environnement :
```bash
cp frontend/exemple.env frontend/.env.development
cp exemple.env .env.development
```
4. Lancer avec Docker :
```bash
docker-compose up --build
```

## 🛠 Mode Développement
Important : Modifie le Dockerfile du backend avant de commencer :
```bash
# Dans backend/Dockerfile, remplacer :
ENV NODE_ENV=production
# Par :
ENV NODE_ENV=development
```

Les services seront disponibles sur :

- Frontend : http://localhost:5173
- Backend : http://localhost:4000
- PostgreSQL : port 5432

## 🤝 Comment contribuer

1. Fork le projet
2. Crée une branche (git checkout -b feature/ma-nouvelle-fonctionnalite)
3. Commit tes changements (git commit -am 'Ajoute une super fonctionnalité')
4. Push sur la branche (git push origin feature/ma-nouvelle-fonctionnalite)
5. Ouvre une Pull Request vers ce repository


## 📄 License

MIT © Lesech Erwann