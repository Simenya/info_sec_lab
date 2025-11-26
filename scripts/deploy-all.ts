import hardhat from "hardhat";

async function main() {
  const networkName = process.env.HARDHAT_NETWORK ?? "ganache";
  const networkConnection = await hardhat.network.connect({ networkName });
  const { ethers } = networkConnection;
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying contracts from ${deployer.address} to ${networkConnection.networkName}`);

  const maintainerList = [deployer.address];
  const verifierList = [deployer.address];

  const publishFactory = await ethers.getContractFactory("PublishRelease");
  const publishContract = await publishFactory.deploy(maintainerList, verifierList);
  await publishContract.waitForDeployment();
  console.log(`PublishRelease deployed at ${await publishContract.getAddress()}`);

  const verifyFactory = await ethers.getContractFactory("VerifyRelease");
  const verifyContract = await verifyFactory.deploy(maintainerList, verifierList);
  await verifyContract.waitForDeployment();
  console.log(`VerifyRelease deployed at ${await verifyContract.getAddress()}`);

  const revokeFactory = await ethers.getContractFactory("RevokeRelease");
  const revokeContract = await revokeFactory.deploy(maintainerList, verifierList);
  await revokeContract.waitForDeployment();
  console.log(`RevokeRelease deployed at ${await revokeContract.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

