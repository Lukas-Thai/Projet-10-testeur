/**
 * Tests API - Eco Bliss Bath
 * Couvre les 6 requêtes identifiées dans le bilan de campagne de Marie :
 *  1. GET  /orders sans authentification  -> erreur attendue
 *  2. POST /login (utilisateur inconnu / connu)
 *  3. GET  /orders avec authentification  -> contenu du panier
 *  4. GET  /products/{id}                 -> fiche produit
 *  5. PUT  /orders/add (produit disponible / en rupture de stock)
 *  6. POST /reviews                       -> ajout d'un avis
 */

const apiUrl = Cypress.env("apiUrl");

describe("Tests API", () => {
  // ---------------------------------------------------------------
  // 1. Données confidentielles sans être connecté
  // ---------------------------------------------------------------
  describe("GET /orders - sans authentification", () => {
    it("retourne une erreur 403 sans token (code attendu par la documentation)", () => {
      cy.request({
        method: "GET",
        url: `${apiUrl}/orders`,
        failOnStatusCode: false,
      }).then((response) => {
        // La documentation attend un 403 pour cette requête sans token
        // (cf. bilan de Marie). L'API renvoie actuellement un 401 :
        // tout écart par rapport à la documentation est une anomalie.
        expect(
          response.status,
          "la documentation attend une erreur 403"
        ).to.eq(403);
      });
    });
  });

  // ---------------------------------------------------------------
  // 2. Login
  // ---------------------------------------------------------------
  describe("POST /login", () => {
    it("retourne 401 pour un utilisateur inconnu", () => {
      cy.fixture("user").then((user) => {
        cy.request({
          method: "POST",
          url: `${apiUrl}/login`,
          body: user.invalidUser,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(401);
        });
      });
    });

    it("retourne 200 et un token pour un utilisateur connu", () => {
      cy.fixture("user").then((user) => {
        cy.request("POST", `${apiUrl}/login`, user.validUser).then(
          (response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property("token");
            expect(response.body.token).to.be.a("string").and.not.be.empty;
          }
        );
      });
    });
  });

  // ---------------------------------------------------------------
  // 3. Panier de l'utilisateur connecté
  // ---------------------------------------------------------------
  describe("GET /orders - avec authentification", () => {
    it("retourne la liste des produits du panier", () => {
      cy.loginApi().then((token) => {
        cy.request({
          method: "GET",
          url: `${apiUrl}/orders`,
          headers: { Authorization: `Bearer ${token}` },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property("orderLines");
          expect(response.body.orderLines).to.be.an("array");
        });
      });
    });
  });

  // ---------------------------------------------------------------
  // 4. Fiche produit
  // ---------------------------------------------------------------
  describe("GET /products/{id}", () => {
    it("retourne la fiche complète d'un produit existant", () => {
      // On récupère d'abord la liste pour obtenir un id valide (pas de valeur en dur)
      cy.request(`${apiUrl}/products`).then((listResponse) => {
        expect(listResponse.status).to.eq(200);
        expect(listResponse.body).to.be.an("array").and.not.be.empty;
        const productId = listResponse.body[0].id;

        cy.request(`${apiUrl}/products/${productId}`).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.include.all.keys(
            "id",
            "name",
            "description",
            "price",
            "picture",
            "availableStock"
          );
          expect(response.body.id).to.eq(productId);
        });
      });
    });
  });

  // ---------------------------------------------------------------
  // 5. Ajout au panier
  // ---------------------------------------------------------------
  describe("Ajout d'un produit au panier (/orders/add)", () => {
    beforeEach(() => {
      cy.emptyCart();
    });

    it("la requête POST /orders/add devrait être acceptée (méthode attendue par la spécification)", () => {
      // Anomalie relevée par Marie : l'ajout au panier devrait être un POST,
      // or seul le PUT est implémenté. Ce test vérifie la conformité à la spec.
      cy.loginApi().then((token) => {
        cy.request(`${apiUrl}/products`).then((listResponse) => {
          const available = listResponse.body.find((p) => p.availableStock > 1);
          expect(available, "un produit disponible existe").to.exist;

          cy.request({
            method: "POST",
            url: `${apiUrl}/orders/add`,
            headers: { Authorization: `Bearer ${token}` },
            body: { product: available.id, quantity: 1 },
            failOnStatusCode: false,
          }).then((response) => {
            expect(
              response.status,
              "POST /orders/add doit être accepté (spec) - une 405 signifie que seul PUT est implémenté"
            ).to.eq(200);
          });
        });
      });
    });

    it("ajoute un produit disponible au panier (PUT /orders/add - méthode réellement implémentée)", () => {
      cy.loginApi().then((token) => {
        cy.request(`${apiUrl}/products`).then((listResponse) => {
          const available = listResponse.body.find((p) => p.availableStock > 1);
          expect(available, "un produit disponible existe").to.exist;

          cy.request({
            method: "PUT",
            url: `${apiUrl}/orders/add`,
            headers: { Authorization: `Bearer ${token}` },
            body: { product: available.id, quantity: 1 },
          }).then((response) => {
            expect(response.status).to.eq(200);
            const line = response.body.orderLines.find(
              (l) => l.product.id === available.id
            );
            expect(line, "le produit ajouté est dans le panier").to.exist;
            expect(line.quantity).to.eq(1);
          });
        });
      });
    });

    it("refuse l'ajout d'un produit en rupture de stock", () => {
      cy.loginApi().then((token) => {
        cy.request(`${apiUrl}/products`).then((listResponse) => {
          const outOfStock = listResponse.body.find(
            (p) => p.availableStock <= 0
          );
          expect(outOfStock, "un produit en rupture de stock existe").to.exist;

          cy.request({
            method: "PUT",
            url: `${apiUrl}/orders/add`,
            headers: { Authorization: `Bearer ${token}` },
            body: { product: outOfStock.id, quantity: 1 },
            failOnStatusCode: false,
          }).then((response) => {
            expect(
              response.status,
              "l'ajout d'un produit en rupture doit être refusé (4xx)"
            ).to.be.within(400, 499);
          });
        });
      });
    });
  });

  // ---------------------------------------------------------------
  // 6. Ajout d'un avis
  // ---------------------------------------------------------------
  describe("POST /reviews", () => {
    it("ajoute un avis en étant connecté", () => {
      cy.loginApi().then((token) => {
        cy.fixture("review").then((review) => {
          cy.request({
            method: "POST",
            url: `${apiUrl}/reviews`,
            headers: { Authorization: `Bearer ${token}` },
            body: review.validReview,
          }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.title).to.eq(review.validReview.title);
            expect(response.body.comment).to.eq(review.validReview.comment);
            expect(response.body.rating).to.eq(review.validReview.rating);
          });
        });
      });
    });

    it("refuse l'ajout d'un avis sans être connecté", () => {
      cy.fixture("review").then((review) => {
        cy.request({
          method: "POST",
          url: `${apiUrl}/reviews`,
          body: review.validReview,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(401);
        });
      });
    });
  });
});
