import { ethers } from 'hardhat';
import * as mumbai from '../snapshots/mumbai.json';

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  const snapshot = getSnapshot(chainId);
  const registryAddress = getRegistryAddress(chainId);
  const registry = await ethers.getContractAt('Registry', registryAddress);
  const deployerAddress = await registry.signer.getAddress();

  for (const team of snapshot.data.teams) {
    // add deployer to account
    const teamMembers = team.members.map(m => m.id);
    teamMembers.push(deployerAddress);

    const createAccountTx = await registry.createAccount(team.name, team.metaURI, teamMembers);
    await createAccountTx.wait();

    const accountID = await registry.generateID(chainId, team.name);
    for (const project of team.projects) {
      const projectMembers = project.members.map(m => m.id);

      const createProjectTx = await registry.createProject(accountID, project.name, project.metaURI, projectMembers);
      await createProjectTx.wait();

      const projectID = await registry.generateID(accountID, project.name);
      for (const release of project.releases) {
        const createReleaseTx = await registry.createRelease(projectID, release.name, release.metaURI);
        await createReleaseTx.wait();
      }
    }

    // remove deployer from account
    const removeAccountMemberTx = await registry.removeAccountMember(accountID, deployerAddress);
    await removeAccountMemberTx.wait();
  }
}

export function getSnapshot(chainId: number) {
  // TODO add other snapshots
  return mumbai;
}

export function getRegistryAddress(chainId: number): string {
  switch(chainId) {
    case 137: // Polygon mainnet
      return '0xc70A069eC7F887a7497a4bdC7bE666C1e18c8DC3';
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
