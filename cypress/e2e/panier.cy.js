/**
 * Test fonctionnel n°2 : Panier
 *
 * Scénario de Marie (utilisateur connecté) :
 *  - Ouvrir un produit dont le stock est supérieur à 1
 *  - L'ajouter au panier et vérifier qu'il y est bien
 *  - Vérifier que le stock affiché a été décrémenté
 *  - Vérifier les limites de quantité (négatif, > 20)
 *  - Vérifier le contenu du panier via l'API
 *  - Vérifier la présence du champ de disponibilité du produit
 */

const apiUrl = Cypress.env("apiUrl");

describe("Test fonctionnel : Panier", () => {
  let product; // produit de test avec du stock disponible

  before(() => {
    // Sélection d'un produit avec suffisamment de stock via l'API
    cy.request(`${apiUrl}/products`).then((response) => {
      product = response.body.find((p) => p.availableStock > 5);
      expect(product, "un produit avec du stock > 5 existe").to.exist;
    });
  });

  beforeEach(() => {
    // Etat initial propre : panier vide
    cy.emptyCart();

    cy.intercept("GET", "**/products/*").as("getProduct");
    cy.intercept({ method: /^(PUT|POST)$/, url: "**/orders/add" }).as(
      "addToCart"
    );
    cy.intercept("GET", "**/orders").as("getOrders");
  });

  const visitProduct = () => {
    cy.visitLogged(`/#/products/${product.id}`);
    cy.wait("@getProduct");
    // On attend que la fiche soit réellement chargée (le formulaire Angular
    // n'est valide qu'une fois les données du produit reçues) avant d'interagir
    cy.getBySel("detail-product-name").should("contain", product.name);
    cy.getBySel("detail-product-stock")
      .invoke("text")
      .should("match", /-?\d+\s*en stock/);
  };

  it("affiche le champ de disponibilité (stock) sur la fiche produit", () => {
    visitProduct();
    cy.getBySel("detail-product-stock")
      .should("be.visible")
      .invoke("text")
      .should("match", /\d+\s*en stock/);
  });

  it("ajoute un produit au panier et vérifie son contenu (interface + API)", () => {
    visitProduct();

    cy.getBySel("detail-product-name").should("contain", product.name);
    cy.getBySel("detail-product-add").click();

    // L'ajout doit aboutir et rediriger vers le panier
    cy.wait("@addToCart").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "/cart");
    cy.wait("@getOrders");

    // Vérification via l'interface
    cy.getBySel("cart-line").should("have.length", 1);
    cy.getBySel("cart-line-name").should("contain", product.name);
    cy.getBySel("cart-line-quantity").should("have.value", "1");

    // Vérification du contenu du panier via l'API
    cy.loginApi().then((token) => {
      cy.request({
        method: "GET",
        url: `${apiUrl}/orders`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((response) => {
        expect(response.status).to.eq(200);
        const line = response.body.orderLines.find(
          (l) => l.product.id === product.id
        );
        expect(line, "le produit est présent dans le panier (API)").to.exist;
        expect(line.quantity).to.eq(1);
      });
    });
  });

  it("décrémente le stock affiché après un ajout au panier", () => {
    visitProduct();

    // Lecture du stock initial affiché sur la fiche produit
    cy.getBySel("detail-product-stock")
      .invoke("text")
      .then((text) => {
        const initialStock = parseInt(text, 10);
        expect(initialStock, "stock initial lisible").to.be.a("number");

        cy.getBySel("detail-product-add").click();
        cy.wait("@addToCart");
        cy.url().should("include", "/cart");

        // Retour sur la fiche produit : le stock doit avoir diminué de 1
        visitProduct();
        cy.getBySel("detail-product-stock")
          .invoke("text")
          .then((newText) => {
            const newStock = parseInt(newText, 10);
            expect(
              newStock,
              "le stock affiché doit être décrémenté après ajout au panier"
            ).to.eq(initialStock - 1);
          });
      });
  });

  it("refuse une quantité négative", () => {
    visitProduct();

    cy.getBySel("detail-product-quantity").clear().type("-1");
    cy.getBySel("detail-product-add").click();

    // Aucune requête d'ajout ne doit partir avec une quantité négative
    cy.get("@addToCart.all").should("have.length", 0);
    cy.url().should("not.include", "/cart");
  });

  it("refuse une quantité égale à 0", () => {
    visitProduct();

    cy.getBySel("detail-product-quantity").clear().type("0");
    cy.getBySel("detail-product-add").click();

    // Une quantité nulle n'a pas de sens métier : l'ajout doit être bloqué
    cy.get("@addToCart.all").should("have.length", 0);
    cy.url().should("not.include", "/cart");
  });

  it("refuse une quantité supérieure à 20", () => {
    visitProduct();

    cy.getBySel("detail-product-quantity").clear().type("21");
    cy.getBySel("detail-product-add").click();

    // Limite métier attendue : pas plus de 20 exemplaires par ajout
    cy.get("@addToCart.all").should("have.length", 0);
    cy.url().should("not.include", "/cart");
  });
});
