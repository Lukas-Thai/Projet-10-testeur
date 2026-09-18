/**
 * Test fonctionnel n°1 : Connexion
 *
 * Scénario de Marie :
 *  - Cliquer sur le bouton de connexion
 *  - La page de connexion avec le formulaire s'affiche
 *  - Saisir l'email et le mot de passe
 *  -> L'utilisateur est connecté et voit le bouton panier.
 */

describe("Test fonctionnel : Connexion", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/login").as("postLogin");
    cy.visit("/");
  });

  it("connecte un utilisateur avec des identifiants valides", () => {
    cy.fixture("user").then((user) => {
      // Accès à la page de connexion via la barre de navigation
      cy.getBySel("nav-link-login").click();
      cy.getBySel("login-form").should("be.visible");

      // Saisie des identifiants
      cy.getBySel("login-input-username").type(user.validUser.username);
      cy.getBySel("login-input-password").type(user.validUser.password);
      cy.getBySel("login-submit").click();

      // L'API doit valider la connexion
      cy.wait("@postLogin").its("response.statusCode").should("eq", 200);

      // L'utilisateur est connecté : le bouton panier est visible,
      // les liens Connexion/Inscription ont disparu
      cy.getBySel("nav-link-cart").should("be.visible");
      cy.getBySel("nav-link-logout").should("be.visible");
      cy.getBySel("nav-link-login").should("not.exist");
      cy.getBySel("nav-link-register").should("not.exist");
    });
  });

  it("refuse la connexion avec un utilisateur inconnu et affiche une erreur", () => {
    cy.fixture("user").then((user) => {
      cy.getBySel("nav-link-login").click();
      cy.getBySel("login-form").should("be.visible");

      cy.getBySel("login-input-username").type(user.invalidUser.username);
      cy.getBySel("login-input-password").type(user.invalidUser.password);
      cy.getBySel("login-submit").click();

      cy.wait("@postLogin").its("response.statusCode").should("eq", 401);

      // Un message d'erreur est affiché et l'utilisateur reste déconnecté
      cy.getBySel("login-errors").should("be.visible");
      cy.getBySel("nav-link-cart").should("not.exist");
      cy.getBySel("nav-link-login").should("be.visible");
    });
  });

  it("ne soumet pas le formulaire si les champs sont vides", () => {
    cy.getBySel("nav-link-login").click();
    cy.getBySel("login-form").should("be.visible");

    cy.getBySel("login-submit").click();

    // Aucune requête ne doit partir avec un formulaire vide
    cy.get("@postLogin.all").should("have.length", 0);
    cy.getBySel("nav-link-cart").should("not.exist");
  });
});
