<div align="center">

# Eco-Bliss-Bath — Tests automatisés Cypress
</div>

<p align="center">
    <img src="https://img.shields.io/badge/MariaDB-v11.7.2-blue">
    <img src="https://img.shields.io/badge/Symfony-v6.2-blue">
    <img src="https://img.shields.io/badge/Angular-v13.3.0-blue">
    <img src="https://img.shields.io/badge/Cypress-v15-brightgreen">
</p>

Site e-commerce de produits de beauté écoresponsables, testé automatiquement avec **Cypress** : tests API, smoke tests, tests de faille XSS et tests fonctionnels (connexion, panier).

---

## Prérequis

- [Docker](https://www.docker.com/) (API + base de données)
- [NodeJS](https://nodejs.org/) (v18 ou supérieure)

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/Lukas-Thai/Projet-10-testeur.git
cd Projet-10-testeur
```

### 2. Démarrer l'API et la base de données

```bash
docker compose up -d
```

L'API est disponible sur `http://localhost:8081`.
La documentation Swagger est consultable sur `http://localhost:8081/api/doc`.

### 3. Démarrer le frontend

```bash
cd frontend
npm install
npm start
```

Le site est disponible sur `http://localhost:4200`.

### 4. Installer les dépendances de test

À la racine du projet :

```bash
npm install
```

## Lancer les tests

> ⚠️ L'API (Docker) et le frontend (`npm start`) doivent être démarrés avant de lancer les tests.

### Mode headless (tous les tests, en ligne de commande)

À la racine du projet :

```bash
npm run cy:run
```

### Mode interactif (interface graphique Cypress)

```bash
npm run cy:open
```

Puis choisir **E2E Testing**, un navigateur, et cliquer sur le fichier de test à exécuter.

## Organisation des tests

| Fichier | Contenu |
|---|---|
| `cypress/e2e/api.cy.js` | Tests des 6 requêtes API (login, panier, produits, ajout au panier, avis) |
| `cypress/e2e/smoke.cy.js` | Smoke tests : présence des champs/boutons de connexion et d'ajout au panier |
| `cypress/e2e/xss.cy.js` | Vérification de faille XSS dans l'espace commentaire (page Avis) |
| `cypress/e2e/connexion.cy.js` | Test fonctionnel : connexion |
| `cypress/e2e/panier.cy.js` | Test fonctionnel : panier (ajout, stock, limites de quantité) |

Les données de test (identifiants, contenus d'avis) sont dans `cypress/fixtures/`.
Les commandes personnalisées (`cy.getBySel`, `cy.loginApi`, `cy.visitLogged`, `cy.emptyCart`) sont dans `cypress/support/commands.js`.

## Génération du rapport de tests

Le rapport HTML est généré **automatiquement** à la fin de l'exécution en mode headless :

```bash
npm run cy:run
```

Le rapport est disponible dans :

```
cypress/reports/index.html
```

Ouvrez ce fichier dans un navigateur pour consulter les résultats détaillés (tests réussis/échoués, graphiques, captures d'écran des échecs).

## Compte de test

| Email | Mot de passe |
|---|---|
| test2@test.fr | testtest |
