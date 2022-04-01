import { expect } from "chai";
import { ethers } from "hardhat";

describe("createAccount", () => {
  it("Should emit AccountCreated", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    await expect(contract.createAccount("acme", "Qm", members[0], members))
      .to.emit(contract, 'AccountCreated');
  });

  it("Should fail with claimed name", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    await expect(contract.createAccount("acme", "Qm", members[0], members))
      .to.be.revertedWith('err-name-claimed');
  });

  it("Should fail with empty members", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    await expect(contract.createAccount("acme", "Qm", members[0], []))
      .to.be.revertedWith('err-empty-members');
  });

  it("Should fail with empty name", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    await expect(contract.createAccount("", "Qm", members[0], members))
      .to.be.revertedWith('err-empty-name');
  });

  it("Should fail with empty meta", async function() {
    const contract = await deployContract();
    const members = await getAddresses();
    
    await expect(contract.createAccount("acme", "", members[0], members))
      .to.be.revertedWith('err-empty-meta');
  });
});

describe("createProject", () => {
  it("Should emit ProjectCreated", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.createProject(accountID, "bin", "Qm", members))
      .to.emit(contract, 'ProjectCreated');
  });

  it("Should succeed with no members", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.createProject(accountID, "bin", "Qm", []))
      .to.emit(contract, 'ProjectCreated');
  });

  it("Should fail with claimed name", async function(){
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    await expect(contract.createProject(accountID, "bin", "Qm", []))
      .to.be.revertedWith('err-name-claimed');
  });

  it("Should fail with no account member", async function(){
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members.slice(1));
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.createProject(accountID, "bin", "Qm", []))
      .to.be.revertedWith('err-not-member');
  });

  it("Should fail with empty account id", async function(){
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    await expect(contract.createProject(0, "bin", "Qm", []))
      .to.be.revertedWith('err-not-member');
  });

  it("Should fail with empty project name", async function(){
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.createProject(accountID, "", "Qm", []))
      .to.be.revertedWith('err-empty-name');
  });

  it("Should fail with empty meta", async function(){
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.createProject(accountID, "bin", "", []))
      .to.be.revertedWith('err-empty-meta');
  });
});

describe("createRelease", () => {
  it("Should emit ReleaseCreated", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.createRelease(projectID, "0.0.1", "Qm"))
      .to.emit(contract, 'ReleaseCreated');
  });

  it("Should publish with no project member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.createRelease(projectID, "0.0.1", "Qm"))
      .to.emit(contract, 'ReleaseCreated');
  });

  it("Should fail with claimed name", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    const createReleaseTx = await contract.createRelease(projectID, "0.0.1", "Qm");
    await createReleaseTx.wait();

    await expect(contract.createRelease(projectID, "0.0.1", "Qm"))
      .to.be.revertedWith('err-name-claimed');
  });

  it("Should fail with empty name", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.createRelease(projectID, "", "Qm"))
      .to.be.revertedWith('err-empty-name');
  });

  it("Should fail with invalid project ID", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    await expect(contract.createRelease(0, "0.0.1", "Qm"))
      .to.be.revertedWith('err-not-exist');
  });

  it("Should fail with empty meta", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.createRelease(projectID, "0.0.1", ""))
      .to.be.revertedWith('err-empty-meta');
  });
});

describe("approveRelease", () => {
  it("Should emit ReleaseApproved", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    const createReleaseTx = await contract.createRelease(projectID, "0.0.1", "Qm");
    await createReleaseTx.wait();

    const releaseID = await contract.generateID(projectID, "0.0.1");
    await expect(contract.approveRelease(releaseID))
      .to.emit(contract, 'ReleaseApproved');
  });

  it("Should fail with invalid release ID", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    const createReleaseTx = await contract.createRelease(projectID, "0.0.1", "Qm");
    await createReleaseTx.wait();

    await expect(contract.approveRelease(0))
      .to.be.revertedWith('err-not-exist');
  });
});

describe("revokeRelease", () => {
  it("Should emit ReleaseRevoked", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    const createReleaseTx = await contract.createRelease(projectID, "0.0.1", "Qm");
    await createReleaseTx.wait();

    const releaseID = await contract.generateID(projectID, "0.0.1");
    const approveReleaseTx = await contract.approveRelease(releaseID);
    await approveReleaseTx.wait();

    await expect(contract.revokeRelease(releaseID))
      .to.emit(contract, 'ReleaseRevoked');
  });

  it("Should fail with invalid release ID", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    const createReleaseTx = await contract.createRelease(projectID, "0.0.1", "Qm");
    await createReleaseTx.wait();

    await expect(contract.revokeRelease(0))
      .to.be.revertedWith('err-not-exist');
  });
});

describe("addAccountMember", () => {
  it("Should emit AccountMemberAdded", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members.slice(0, 1));
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.addAccountMember(accountID, members[1]))
      .to.emit(contract, "AccountMemberAdded");
  });

  it("Should fail with duplicate member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.addAccountMember(accountID, members[1]))
      .to.be.revertedWith('err-member-exist');
  });

  it("Should fail with no account member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members.slice(1));
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.addAccountMember(accountID, members[0]))
      .to.be.revertedWith('err-not-member');
  });

  it("Should fail with invalid account ID", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    await expect(contract.addAccountMember(0, members[1]))
      .to.be.revertedWith('err-not-member');
  });
});

describe("removeAccountMember", () => {
  it("Should emit AccountMemberRemoved", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.removeAccountMember(accountID, members[1]))
      .to.emit(contract, "AccountMemberRemoved");
  });

  it("Should fail with no account member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members.slice(1));
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.removeAccountMember(accountID, members[0]))
      .to.be.revertedWith('err-not-member');
  });

  it("Should fail with non existant member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members.slice(0, 3));
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.removeAccountMember(accountID, members[5]))
      .to.be.revertedWith('err-member-not-exist');
  });

  it("Should fail with invalid account ID", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    await expect(contract.removeAccountMember(0, members[1]))
      .to.be.revertedWith('err-not-member');
  });
});

describe("addProjectMember", () => {
  it("Should emit ProjectMemberAdded", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.addProjectMember(projectID, members[0]))
      .to.emit(contract, "ProjectMemberAdded");
  });

  it("Should fail with duplicate member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.addProjectMember(projectID, members[0]))
      .to.be.revertedWith('err-member-exist');
  });

  it("Should fail with no account member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();
    const signers = await ethers.getSigners();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members.slice(0, 1));
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.connect(signers[1]).addProjectMember(projectID, members[0]))
      .to.be.revertedWith('err-not-member');
  });

  it("Should fail with invalid project ID", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", []);
    await createProjectTx.wait();

    await expect(contract.addProjectMember(0, members[0]))
      .to.be.revertedWith('err-not-exist');
  });
});

describe("removeProjectMember", () => {
  it("Should emit ProjectMemberRemoved", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.removeProjectMember(projectID, members[0]))
      .to.emit(contract, "ProjectMemberRemoved");
  });

  it("Should fail with non existant member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members.slice(0, 3));
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.removeProjectMember(projectID, members[5]))
      .to.be.revertedWith('err-member-not-exist');
  });

  it("Should fail with no account member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();
    const signers = await ethers.getSigners();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members.slice(0, 1));
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.connect(signers[1]).removeProjectMember(projectID, members[0]))
      .to.be.revertedWith('err-not-member');
  });

  it("Should fail with invalid project ID", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    await expect(contract.removeProjectMember(0, members[0]))
      .to.be.revertedWith('err-not-exist');
  });
});

describe("setAccountMetaURI", () => {
  it("Should emit AccountUpdated", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.setAccountMetaURI(accountID, "baf"))
      .to.emit(contract, "AccountUpdated");
  });

  it("Should fail with no account member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members.slice(1));
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.setAccountMetaURI(accountID, "baf"))
      .to.be.revertedWith('err-not-member');
  });

  it("Should fail with invalid account ID", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    await expect(contract.setAccountMetaURI(0, "baf"))
      .to.be.revertedWith('err-not-member');
  });

  it("Should fail with empty meta", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    await expect(contract.setAccountMetaURI(accountID, ""))
      .to.be.revertedWith('err-empty-meta');
  });
});

describe("setProjectMetaURI", () => {
  it("Should emit ProjectUpdated", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.setProjectMetaURI(projectID, "baf"))
      .to.emit(contract, "ProjectUpdated");
  });

  it("Should fail with no account member", async function() {
    const contract = await deployContract();
    const members = await getAddresses();
    const signers = await ethers.getSigners();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members.slice(0, 1));
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.connect(signers[1]).setProjectMetaURI(projectID, "baf"))
      .to.be.revertedWith('err-not-member');
  });

  it("Should fail with invalid project ID", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    await expect(contract.setProjectMetaURI(0, "baf"))
      .to.be.revertedWith('err-not-exist');
  });

  it("Should fail with empty meta", async function() {
    const contract = await deployContract();
    const members = await getAddresses();

    const createAccountTx = await contract.createAccount("acme", "Qm", members[0], members);
    await createAccountTx.wait();

    const accountID = await contract.generateID(31337, "acme");
    const createProjectTx = await contract.createProject(accountID, "bin", "Qm", members);
    await createProjectTx.wait();

    const projectID = await contract.generateID(accountID, "bin");
    await expect(contract.setProjectMetaURI(projectID, ""))
      .to.be.revertedWith('err-empty-meta');
  });
});

describe("generateID", () => {
  it("Should generate releaseID from projectID and releaseName", async function () {
    const contract = await deployContract();

    const accountID = await contract.generateID(31337, "acme");
    const projectID = await contract.generateID(accountID, "bin");
    const releaseID = await contract.generateID(projectID, "0.0.1");

    expect(accountID.toHexString()).to.equal("0xd536bdbb7dd07f6d4a73e4ad4defa1c64e0078a4d77d4fc1cbf62b2c57ca9ef9");
    expect(projectID.toHexString()).to.equal("0x1a240c874444b80e555f1c03ed5daec7f099acda27441020ef344496a5fd81d5");
    expect(releaseID.toHexString()).to.equal("0x961bc62a541f18ddd675b881528d3482ef44658f76a61398763fdeb19fa9dd0e");
  })
});

export async function deployContract() {
  const factory = await ethers.getContractFactory("Registry");
  const contract = await factory.deploy("0x0000000000000000000000000000000000000000");
  
  await contract.deployed();
  return contract;
}

export async function getAddresses() {
  const signers = await ethers.getSigners();
  return signers.map((acct) => acct.address);
}
