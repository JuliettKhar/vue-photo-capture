// npx ts-jest config:init
/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  // Playwright specs live in e2e/ and must not be picked up by Jest.
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
};