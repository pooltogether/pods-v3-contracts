module.exports = {
  // mocha: { reporter: "mocha-junit-reporter" },
  // measureFunctionCoverage: false,
  // measureStatementCoverage: false,
  skipFiles: [
    "external",
    "mocks",
    "test",
    "libraries/FixedPoint.sol",
    "libraries/ExtendedSafeCast.sol",
    "PodManager.sol",
  ],
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
  },
};
