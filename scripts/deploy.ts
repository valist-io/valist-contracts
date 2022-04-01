import { ethers } from 'hardhat';

// Change this when deploying to other live networks
const forwarderAddress = "0x0000000000000000000000000000000000000000";

async function main() {
  const Registry = await ethers.getContractFactory("Registry");
  const License = await ethers.getContractFactory("License");

  const registry = await Registry.deploy(forwarderAddress);
  await registry.deployed();

  const license = await License.deploy(registry.address);
  await license.deployed();

  console.log("Registry deployed to:", registry.address);
  console.log("License deployed to:", license.address);
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
