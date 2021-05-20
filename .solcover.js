module.exports = {
  mocha: { reporter: "mocha-junit-reporter" },
  skipFiles: [
    "external",
    "mocks",
    "test",
    "interfaces",
    "libraries",
    "PodManager.sol",
  ],
};
