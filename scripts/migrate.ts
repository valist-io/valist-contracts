import { ethers } from 'hardhat';
import * as snapshot from '../assets/snapshot.json';

async function main() {
  const registryAddress = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';
  const registry = await ethers.getContractAt('Registry', registryAddress);

  const { chainId } = await registry.provider.getNetwork();
  const deployerAddress = await registry.signer.getAddress();

  for (const team of snapshot.data.teams) {
    // add deployer to members so we can create teams and projects
    const teamMembers = team.members.map(m => m.id).concat([deployerAddress]);
    const beneficiary = teamMembers[0]; // TODO missing beneficiary

    const createAccountTx = await registry.createAccount(team.name, team.metaURI, beneficiary, teamMembers);
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

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
