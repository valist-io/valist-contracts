import { ethers } from "hardhat";

export async function deployRegistry(forwarder: string = "0x0000000000000000000000000000000000000000") {
  const factory = await ethers.getContractFactory("Registry");
  const contract = await factory.deploy(forwarder);
  
  await contract.deployed();
  return contract;
}

export async function deployLicense(registry: string = "0x0000000000000000000000000000000000000000") {
  const factory = await ethers.getContractFactory("License");
  const contract = await factory.deploy(registry);
  
  await contract.deployed();
  return contract;
}

export async function deployTestERC20() {
  const factory = await ethers.getContractFactory("TestERC20");
  const contract = await factory.deploy();
  
  await contract.deployed();
  return contract;
}

export async function getAddresses() {
  const signers = await ethers.getSigners();
  return signers.map((acct) => acct.address);
}