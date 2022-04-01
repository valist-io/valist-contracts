import { ethers } from 'hardhat';
import * as snapshot from '../assets/snapshot.json';

async function main() {
  const deployerAddress = '0xF97e3669bC9612d726d7E9FFcEC940FB9c0B070e'; // TODO change
  const registryAddress = '0x6639d7eD2dCEBa642Ec607a09dD3D8A3E807dA34'; // TODO change

  const registry = await ethers.getContractAt('Registry', registryAddress);
  // const { chainId } = await registry.provider.getNetwork();
  console.log('migrating valist registry...');

  // create accounts
  for (const team of snapshot.data.teams) {
    // add deployer to members so we can create teams and projects
    const teamMembers = team.members.map(m => m.id).concat([deployerAddress]);
    const beneficiary = teamMembers[0]; // TODO missing beneficiary

    console.log('createAccount', team.name);
    const createAccountTx = await registry.createAccount(team.name, team.metaURI, beneficiary, teamMembers);
    await createAccountTx.wait();

    // TODO WHY DOES GANACHE USE CHAIN ID 1 ??????
    const accountID = await registry.generateID(1, team.name);

    // create projects
    for (const project of team.projects) {
      const projectMembers = project.members.map(m => m.id);

      console.log('createProject', project.name);
      const createProjectTx = await registry.createProject(accountID, project.name, project.metaURI, projectMembers);
      await createProjectTx.wait();

      const projectID = await registry.generateID(accountID, project.name);

      // create releases
      for (const release of project.releases) {
        console.log('createRelease', release.name);
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
