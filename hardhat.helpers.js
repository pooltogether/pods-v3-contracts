/**
 * @name blocknumber
 */
task("blocknumber").setAction(async function ({ time }) {
  const jsonProvider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8544/"
  );
  const blocknumber = await jsonProvider.getBlockNumber();
  console.log("Bloknumber:", blocknumber);
});

/**
 * @name increase-time
 * @param time
 */
task("increase-time")
  .addPositionalParam("time", "Time in seconds")
  .setAction(async function ({ time }) {
    const jsonProvider = new ethers.providers.JsonRpcProvider(
      "http://127.0.0.1:8544/"
    );
    await jsonProvider.send("evm_increaseTime", [Number(time)]);
  });

/**
 * @name set-time
 * @param time
 */
task("set-time")
  .addPositionalParam("time", "Token Name")
  .setAction(async function ({ time }) {
    const jsonProvider = new ethers.providers.JsonRpcProvider(
      "http://127.0.0.1:8544/"
    );
    await jsonProvider.send("evm_setNextBlockTimestamp", [Number(time)]);
  });

/**
 * @name mine
 */
task("mine").setAction(async function () {
  const jsonProvider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8544/"
  );
  const tx = await jsonProvider.send("evm_mine");
  console.log(tx);
});

/**
 * @name accounts
 */
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();
  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

/**
 * @name mine
 */
task("blockup", "Increases the blocknumber by X amount")
  .addPositionalParam("amount", "Number of blocks to produce")
  .setAction(async function ({ amount }) {
    const jsonProvider = new ethers.providers.JsonRpcProvider(
      "http://127.0.0.1:8544/"
    );

    for (let index = 0; index < amount; index++) {
      await jsonProvider.send("evm_mine");
    }
  });
