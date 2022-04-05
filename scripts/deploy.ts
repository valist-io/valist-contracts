import { ethers } from 'hardhat';

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  const forwarderAddress = getForwarderAddress(chainId);

  console.log("Deploying to:", chainId);

  const Registry = await ethers.getContractFactory("Registry");
  const License = await ethers.getContractFactory("License");
  const Paymaster = await ethers.getContractFactory("Paymaster");

  const registry = await Registry.deploy(forwarderAddress);
  await registry.deployed();

  const license = await License.deploy(registry.address);
  await license.deployed();

  const paymaster = await Paymaster.deploy();
  await paymaster.deployed();

  const allowAddressTx = await paymaster.allowAddress(registry.address);
  await allowAddressTx.wait();

  console.log("Registry deployed to:", registry.address);
  console.log("License deployed to:", license.address);
  console.log("Paymaster deployed to:", paymaster.address);
}

function getForwarderAddress(chainId: number): string {
  switch(chainId) {
    case 137: // polygon mainnet
      return '0xdA78a11FD57aF7be2eDD804840eA7f4c2A38801d';
    case 80001: // polygon mumbai
      return '0x4d4581c01A457925410cd3877d17b2fd4553b2C5';
    default: // testnet or unknown
      return '0x0000000000000000000000000000000000000000';
  }
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
