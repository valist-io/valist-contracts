import { ethers } from 'hardhat';
import * as mumbai from '../snapshots/mumbai.json';
import * as polygon from '../snapshots/polygon.json';

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  const snapshot = getSnapshot(chainId);
  const registryAddress = getRegistryAddress(chainId);
  const registry = await ethers.getContractAt('Registry', registryAddress);
  const deployerAddress = await registry.signer.getAddress();

  for (const team of snapshot.data.teams) {
    // add deployer to account
    const accountMembers = team.members.map(m => m.id).concat([deployerAddress]);
    const accountID = await registry.generateID(chainId, team.name);
    const accountExists = await registry.metaByID(accountID) !== "";
    if (!accountExists) {
      console.log("CreateAccount", team.name);
      const createAccountTx = await registry.createAccount(team.name, team.metaURI, accountMembers);
      await createAccountTx.wait();  
    }

    for (const project of team.projects) {
      const projectMembers = project.members.map(m => m.id);
      const projectID = await registry.generateID(accountID, project.name);
      const projectExists = await registry.metaByID(projectID) !== "";
      if (!projectExists) {
        console.log("CreateProject", project.name);
        const createProjectTx = await registry.createProject(accountID, project.name, project.metaURI, projectMembers);
        await createProjectTx.wait();  
      }

      for (const release of project.releases) {
        const releaseID = await registry.generateID(projectID, release.name);
        const releaseExists = await registry.metaByID(releaseID) !== "";
        if (!releaseExists) {
          console.log("CreateRelease", release.name);
          const createReleaseTx = await registry.createRelease(projectID, release.name, release.metaURI);
          await createReleaseTx.wait();  
        }
      }
    }

    const memberExists = await registry.isAccountMember(accountID, deployerAddress);
    if (memberExists) {
      console.log("RemoveAccountMember", team.name);
      const removeAccountMemberTx = await registry.removeAccountMember(accountID, deployerAddress);
      await removeAccountMemberTx.wait();  
    }
  }
}

export function getSnapshot(chainId: number) {
  switch (chainId) {
    case 137: // Polygon mainnet
      return polygon;
    default: // test network or other
      return mumbai;
  }
}

export function getRegistryAddress(chainId: number): string {
  switch(chainId) {
    case 137: // Polygon mainnet
      return '0xD504d012D78B81fA27288628f3fC89B0e2f56e24';
    case 80001: // Mumbai testnet
      return '0xD504d012D78B81fA27288628f3fC89B0e2f56e24';
    default: // test network or other
      return '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';
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
