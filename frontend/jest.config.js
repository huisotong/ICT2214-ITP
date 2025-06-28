export default {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-router-dom|react-markdown|remark-.*)/)",
  ],
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(js|jsx)",
    "<rootDir>/src/**/*.(test|spec).(js|jsx)",
  ],
  moduleFileExtensions: ["js", "jsx", "json"],
  moduleNameMapping: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "jest-transform-stub",
  },
  collectCoverageFrom: [
    "src/**/*.(js|jsx)",
    "!src/index.js",
    "!src/main.jsx",
    "!src/reportWebVitals.js",
  ],
};
