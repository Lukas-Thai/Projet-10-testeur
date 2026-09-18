/**
 * Tests de faille XSS - espace commentaire (page Avis)
 *
 * Le composant reviews affiche le commentaire via [innerHTML] :
 * un commentaire contenant du HTML/JS risque donc d'être interprété
 * par le navigateur au lieu d'être affiché comme du texte.
 */

describe("Faille XSS - espace commentaire", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/reviews").as("postReview");
    cy.intercept("GET", "**/reviews").as("getReviews");

    cy.visitLogged("/#/reviews");
    cy.wait("@getReviews");
  });

  /**
   * Remplit et soumet le formulaire d'avis avec le contenu donné.
   */
  const submitReview = (review) => {
    cy.getBySel("review-input-rating-images")
      .find("img")
      .eq(review.rating - 1)
      .click();
    cy.getBySel("review-input-title").type(review.title);
    cy.getBySel("review-input-comment").type(review.comment, {
      parseSpecialCharSequences: false,
    });
    cy.getBySel("review-submit").click();
    cy.wait("@postReview");
    cy.wait("@getReviews");
  };

  it("n'exécute pas un script injecté dans un commentaire", () => {
    cy.fixture("review").then((review) => {
      submitReview(review.xssScriptReview);

      // Si la faille existe, l'attribut onerror du payload aura défini
      // window.xssExecuted à true lors du rendu de la liste des avis.
      cy.getBySel("review-detail").should("have.length.greaterThan", 0);
      cy.window().then((win) => {
        expect(
          win.xssExecuted,
          "le script injecté ne doit pas être exécuté"
        ).to.be.undefined;
      });
    });
  });

  it("neutralise une balise <script> et les attributs d'événement dans le DOM (faille XSS absente)", () => {
    cy.fixture("review").then((review) => {
      submitReview(review.xssScriptTagReview);

      // Vérification directe du DOM : aucun élément <script> ni aucun
      // attribut d'événement (onerror, onload, onclick...) ne doit être
      // inséré dans la liste des avis, quel que soit le payload soumis.
      cy.getBySel("review-detail").should("have.length.greaterThan", 0);
      cy.getBySel("review-comment").find("script").should("not.exist");
      cy.getBySel("review-comment")
        .find("[onerror], [onload], [onclick], [onmouseover]")
        .should("not.exist");
      cy.window().then((win) => {
        expect(
          win.xssExecuted,
          "aucun code JavaScript injecté ne doit être exécuté"
        ).to.be.undefined;
      });
    });
  });

  it("affiche le HTML d'un commentaire comme du texte brut (non interprété)", () => {
    cy.fixture("review").then((review) => {
      submitReview(review.xssHtmlReview);

      // Comportement attendu : le commentaire doit être affiché tel quel,
      // avec ses balises visibles en texte brut. Si la balise <b> est
      // interprétée, il y a injection HTML (vecteur de faille XSS).
      cy.contains(
        "[data-cy=review-comment]",
        review.xssHtmlReview.comment
      ).should("exist");
      cy.get("#xss-html-injection").should("not.exist");
    });
  });
});
