import { ethers } from 'hardhat';
import { getRegistryAddress, getForwarderAddress } from './common';

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  const registryAddress = getRegistryAddress(chainId);
  const registry = await ethers.getContractAt('Registry', registryAddress);

  const forwarderAddress = getForwarderAddress(chainId);
  const tx = await registry.setTrustedForwarder(forwarderAddress);

  await tx.wait();
  console.log(`setTrustedForwarder to ${forwarderAddress}`);
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
