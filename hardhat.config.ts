import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  
  for (const account of accounts) {
    console.log(account.address);
  }
});


let accounts: any;

// import from private key
if (process.env.PRIVATE_KEY) {
  accounts = [process.env.PRIVATE_KEY];
}

// import from mnemonic
if (process.env.MNEMONIC) {
  accounts = {
    mnemonic: process.env.MNEMONIC,
    path: process.env.MNEMONIC_PATH ?? "m/44'/60'/0'/0",
    initialIndex: 0,
    count: 1,
    passphrase: "",
  };
}

module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ganache: {
      url: "http://localhost:8545",
    },
    mumbai: {
      url: "https://rpc.valist.io/mumbai",
      accounts,
    },
    polygon: {
      url: "https://rpc.valist.io/polygon",
      accounts,
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    token: "MATIC",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPriceApi: "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice"
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  }
};
