/**
 * Smoke tests - Eco Bliss Bath
 * Vérifient la présence des éléments essentiels de l'interface :
 *  - champs et boutons de connexion,
 *  - boutons d'ajout au panier quand l'utilisateur est connecté.
 */

describe("Smoke tests", () => {
  describe("Champs et boutons de connexion", () => {
    it("affiche le lien de connexion dans la barre de navigation (utilisateur déconnecté)", () => {
      cy.visit("/");
      cy.getBySel("nav-link-login").should("be.visible");
      cy.getBySel("nav-link-register").should("be.visible");
    });

    it("affiche le formulaire de connexion avec ses champs et son bouton", () => {
      cy.visit("/#/login");
      cy.getBySel("login-form").should("be.visible");
      cy.getBySel("login-input-username").should("be.visible");
      cy.getBySel("login-input-password").should("be.visible");
      cy.getBySel("login-submit").should("be.visible").and("be.enabled");
    });
  });

  describe("Boutons d'ajout au panier (utilisateur connecté)", () => {
    beforeEach(() => {
      cy.intercept("GET", "**/products").as("getProducts");
    });

    it("affiche le lien 'Mon panier' dans la barre de navigation", () => {
      cy.visitLogged("/");
      cy.getBySel("nav-link-cart").should("be.visible");
      cy.getBySel("nav-link-logout").should("be.visible");
    });

    it("affiche le bouton d'ajout au panier sur une fiche produit", () => {
      cy.intercept("GET", "**/products/*").as("getProduct");

      cy.visitLogged("/#/products");
      cy.wait("@getProducts");

      // On attend que la liste soit chargée avant de cliquer
      cy.getBySel("product-link").should("have.length.greaterThan", 0);
      cy.getBySel("product-link").first().click();
      cy.wait("@getProduct");

      cy.getBySel("detail-product-quantity").should("be.visible");
      cy.getBySel("detail-product-add").should("be.visible").and("be.enabled");
      cy.getBySel("detail-product-stock").should("be.visible");
    });
  });
});
