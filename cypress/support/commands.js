// ***********************************************
// Commandes personnalisées Cypress
// ***********************************************

/**
 * Sélectionne un élément via son attribut data-cy.
 * Usage : cy.getBySel('login-submit')
 */
Cypress.Commands.add("getBySel", (selector, ...args) => {
  return cy.get(`[data-cy=${selector}]`, ...args);
});

/**
 * Connexion via l'API : retourne le token JWT.
 * Usage : cy.loginApi().then((token) => { ... })
 */
Cypress.Commands.add("loginApi", () => {
  return cy.fixture("user").then((user) => {
    return cy
      .request("POST", `${Cypress.env("apiUrl")}/login`, user.validUser)
      .then((response) => {
        expect(response.status).to.eq(200);
        return response.body.token;
      });
  });
});

/**
 * Visite une page en étant connecté (le token est posé dans le
 * localStorage avant le chargement de l'application).
 * Usage : cy.visitLogged('/#/reviews')
 */
Cypress.Commands.add("visitLogged", (path) => {
  cy.loginApi().then((token) => {
    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem("user", token);
      },
    });
  });
});

/**
 * Vide le panier de l'utilisateur de test via l'API,
 * pour garantir un état initial propre avant les tests du panier.
 * Usage : cy.emptyCart()
 */
Cypress.Commands.add("emptyCart", () => {
  cy.loginApi().then((token) => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("apiUrl")}/orders`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 200 && response.body.orderLines) {
        response.body.orderLines.forEach((line) => {
          cy.request({
            method: "DELETE",
            url: `${Cypress.env("apiUrl")}/orders/${line.id}/delete`,
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false,
          });
        });
      }
    });
  });
});
