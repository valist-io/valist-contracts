import { ethers } from 'hardhat';
import { getForwarderAddress, getRelayHubAddress } from './common';

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  const forwarderAddress = getForwarderAddress(chainId);
  const relayHubAddress = getRelayHubAddress(chainId);
  console.log("Deploying to:", chainId);

  const Registry = await ethers.getContractFactory("Registry");
  const License = await ethers.getContractFactory("License");
  const Paymaster = await ethers.getContractFactory("Paymaster");

  const registry = await Registry.deploy(forwarderAddress);
  await registry.deployed();
  console.log("Registry deployed to:", registry.address);

  const license = await License.deploy(registry.address);
  await license.deployed();
  console.log("License deployed to:", license.address);

  const paymaster = await Paymaster.deploy();
  await paymaster.deployed();
  console.log("Paymaster deployed to:", paymaster.address);

  const setRelayHubTx = await paymaster.setRelayHub(relayHubAddress);
  await setRelayHubTx.wait();

  const setTrustedForwarderTx = await paymaster.setTrustedForwarder(forwarderAddress);
  await setTrustedForwarderTx.wait();

  const allowAddressTx = await paymaster.allowAddress(registry.address);
  await allowAddressTx.wait();

  const valistEthAddress = "0x393b9443545e0b428b008b25e1cf1c96d5b8fe06";
  console.log("Transferring ownership to:", valistEthAddress);

  const setPaymasterOwnerTx = await paymaster.transferOwnership(valistEthAddress);
  await setPaymasterOwnerTx.wait();

  const setLicenseOwnerTx = await license.setOwner(valistEthAddress);
  await setLicenseOwnerTx.wait();

  const setRegistryOwnerTx = await registry.setOwner(valistEthAddress);
  await setRegistryOwnerTx.wait();
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
