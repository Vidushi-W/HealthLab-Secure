module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
  clearMocks: true,
  roots: ["<rootDir>/unit", "<rootDir>/integration"],
  collectCoverageFrom: [
    "../src/modules/community/**/*.js",
    "../src/controllers/adminController.js",
    "../src/services/analyticsService.js",
    "!../src/**/config/**",
  ],
};
