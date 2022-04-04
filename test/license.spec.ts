import { expect } from "chai";
import { ethers } from "hardhat";
import * as utils from "./utils";

describe("license.setPrice(uint256,uint256)", () => {
  it("Should emit PriceChanged", async function() {
  	const registry = await utils.deployRegistry();
  	const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();

    const createAccountTx = await registry.createAccount("acme", "Qm", members);
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const setPrice = license['setPrice(uint256,uint256)'];
    const getPrice = license['getPrice(uint256)'];

    await expect(setPrice(projectID, 1000))
      .to.emit(license, 'PriceChanged');

    // make sure the price was set correctly
    const price = await getPrice(projectID);
    expect(price).to.equal(1000);
  });

  it("Should revert when not account member", async function() {
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();
    const signers = await ethers.getSigners();

    const createAccountTx = await registry.createAccount("acme", "Qm", members.slice(0, 1));
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const setPrice = license.connect(signers[1])['setPrice(uint256,uint256)'];

    await expect(setPrice(projectID, 1000))
      .to.be.revertedWith('err-not-member');
  });
});

describe('license.setPrice(address,uint256,uint256)', () => {
  it("Should emit PriceChanged", async function() {
    const erc20 = await utils.deployTestERC20();
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();

    const createAccountTx = await registry.createAccount("acme", "Qm", members);
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const setPrice = license['setPrice(address,uint256,uint256)'];
    const getPrice = license['getPrice(address,uint256)'];

    await expect(setPrice(erc20.address, projectID, 1000))
      .to.emit(license, 'PriceChanged');

    // make sure the price was set correctly
    const price = await getPrice(erc20.address, projectID);
    expect(price).to.equal(1000);
  });

  it("Should revert when not account member", async function() {
    const erc20 = await utils.deployTestERC20();
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();
    const signers = await ethers.getSigners();

    const createAccountTx = await registry.createAccount("acme", "Qm", members.slice(0, 1));
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const setPrice = license.connect(signers[1])['setPrice(address,uint256,uint256)'];

    await expect(setPrice(erc20.address, projectID, 1000))
      .to.be.revertedWith('err-not-member');
  });
});

describe('license.purchase(uint256,address)', () => {
  it("Should emit ProductPurchased", async function() {
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();

    const createAccountTx = await registry.createAccount("acme", "Qm", members);
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const setPrice = license['setPrice(uint256,uint256)'];
    const purchase = license['purchase(uint256,address)'];
    const getBalance = license['getBalance(uint256)'];

    const setPriceTx = await setPrice(projectID, 1000);
    await setPriceTx.wait();

    // set a royalty fee
    const setRoyaltyTx = await license.setRoyalty(1000);
    await setRoyaltyTx.wait();

    // purchase the license using native tokens
    await expect(purchase(projectID, members[0], { value: 1000 }))
      .to.emit(license, 'ProductPurchased');

    // ensure product balance is correct
    const balance = await getBalance(projectID);
    expect(balance).to.equal(900);

    // ensure token balance is correct
    const balanceOf = await license.balanceOf(members[0], projectID);
    expect(balanceOf).to.equal(1);
  });

  it("Should revert when price is 0", async function() {
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();

    const createAccountTx = await registry.createAccount("acme", "Qm", members);
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const purchase = license['purchase(uint256,address)'];

    await expect(purchase(projectID, members[0], { value: 1000 }))
      .to.be.revertedWith('err-not-allowed');
  });
});

describe('license.purchase(address,uint256,address)', () => {
  it("Should emit ProductPurchased", async function() {
    const erc20 = await utils.deployTestERC20();
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();
    const signers = await ethers.getSigners();

    const createAccountTx = await registry.createAccount("acme", "Qm", members);
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const setPrice = license['setPrice(address,uint256,uint256)'];
    const purchase = license['purchase(address,uint256,address)'];
    const getBalance = license['getBalance(address,uint256)'];

    const setPriceTx = await setPrice(erc20.address, projectID, 1000);
    await setPriceTx.wait();

    // mint some erc20 tokens so we can spend them
    const mintTokensTx = await erc20.mint(members[0], 1000);
    await mintTokensTx.wait();

    // approve the license contract to transfer tokens
    const approveTokensTx = await erc20.approve(license.address, 1000);
    await approveTokensTx.wait();

    // set a royalty fee
    const setRoyaltyTx = await license.setRoyalty(1000);
    await setRoyaltyTx.wait();

    // purchase the license using erc20 tokens
    await expect(purchase(erc20.address, projectID, members[0]))
      .to.emit(license, 'ProductPurchased');

    // ensure product balance is correct
    const balance = await getBalance(erc20.address, projectID);
    expect(balance).to.equal(900);

    // ensure token balance is correct
    const balanceOf = await license.balanceOf(members[0], projectID);
    expect(balanceOf).to.equal(1);

    // make sure owner gets royalty
    const ownerBalance = await erc20.balanceOf(members[0]);
    expect(ownerBalance).to.equal(100);
  });

  it("Should revert when price is 0", async function() {
    const erc20 = await utils.deployTestERC20();
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();

    const createAccountTx = await registry.createAccount("acme", "Qm", members);
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const purchase = license['purchase(address,uint256,address)'];

    await expect(purchase(erc20.address, projectID, members[0]))
      .to.be.revertedWith('err-not-allowed');
  });
});

describe('license.withdraw(uint256,address)', () => {
  it("Should emit BalanceWithdrawn", async function() {
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();

    const createAccountTx = await registry.createAccount("acme", "Qm", members);
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const setPrice = license['setPrice(uint256,uint256)'];
    const purchase = license['purchase(uint256,address)'];
    const withdraw = license['withdraw(uint256,address)'];
    const getBalance = license['getBalance(uint256)'];

    const setPriceTx = await setPrice(projectID, 1000);
    await setPriceTx.wait();

    // purchase the license using native tokens
    const purchaseTx = await purchase(projectID, members[0], { value: 1000 });
    await purchaseTx.wait();

    // withdraw the balance
    await expect(withdraw(projectID, members[0]))
      .to.emit(license, 'BalanceWithdrawn');

    // ensure product balance is correct
    const balance = await getBalance(projectID);
    expect(balance).to.equal(0);
  });

  it("Should revert when not account member", async function() {
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();
    const signers = await ethers.getSigners();

    const createAccountTx = await registry.createAccount("acme", "Qm", members.slice(0, 1));
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const withdraw = license.connect(signers[1])['withdraw(uint256,address)'];

    // withdraw the balance
    await expect(withdraw(projectID, members[0]))
      .to.be.revertedWith('err-not-member');
  });
});

describe('license.withdraw(address,uint256,address)', () => {
  it("Should emit BalanceWithdrawn", async function() {
    const erc20 = await utils.deployTestERC20();
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();

    const createAccountTx = await registry.createAccount("acme", "Qm", members);
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const setPrice = license['setPrice(address,uint256,uint256)'];
    const purchase = license['purchase(address,uint256,address)'];
    const withdraw = license['withdraw(address,uint256,address)'];
    const getBalance = license['getBalance(address,uint256)'];

    const setPriceTx = await setPrice(erc20.address, projectID, 1000);
    await setPriceTx.wait();

    // mint some erc20 tokens so we can spend them
    const mintTokensTx = await erc20.mint(members[0], 1000);
    await mintTokensTx.wait();

    // approve the license contract to transfer tokens
    const approveTokensTx = await erc20.approve(license.address, 1000);
    await approveTokensTx.wait();

    // purchase the license using native tokens
    const purchaseTx = await purchase(erc20.address, projectID, members[0]);
    await purchaseTx.wait();

    // withdraw the balance
    await expect(withdraw(erc20.address, projectID, members[0]))
      .to.emit(license, 'BalanceWithdrawn');

    // ensure product balance is correct
    const balance = await getBalance(erc20.address, projectID);
    expect(balance).to.equal(0);
  });

  it("Should revert when not account member", async function() {
    const erc20 = await utils.deployTestERC20();
    const registry = await utils.deployRegistry();
    const license = await utils.deployLicense(registry.address);
    const members = await utils.getAddresses();
    const signers = await ethers.getSigners();

    const createAccountTx = await registry.createAccount("acme", "Qm", members.slice(0, 1));
    await createAccountTx.wait();

    const accountID = await registry.generateID(31337, "acme");
    const createProjectTx = await registry.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await registry.generateID(accountID, "bin");
    const withdraw = license.connect(signers[1])['withdraw(address,uint256,address)'];

    // withdraw the balance
    await expect(withdraw(erc20.address, projectID, members[0]))
      .to.be.revertedWith('err-not-member');
  });
});