import { ethers } from 'hardhat';

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  console.log("Deploying to:", chainId);

  const Forwarder = await ethers.getContractFactory("Forwarder");

  const forwarder = await Forwarder.deploy();
  await forwarder.deployed();
  console.log("Forwarder deployed to:", forwarder.address);
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
