const { defineConfig } = require("cypress");

module.exports = defineConfig({
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    charts: true,
    reportDir: "cypress/reports",
    reportPageTitle: "Eco Bliss Bath - Rapport de campagne de tests",
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },
  e2e: {
    baseUrl: "http://localhost:4200",
    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);
    },
    env: {
      apiUrl: "http://localhost:8081",
    },
  },
});
