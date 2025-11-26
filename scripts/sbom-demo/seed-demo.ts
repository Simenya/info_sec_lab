import hardhat from "hardhat";

/**
 * Utility script to push demo SBOM data on-chain so the React client can consume it.
 * The script assumes already deployed `RevokeRelease` and exported its address as RELEASE_CONTRACT.
 */
async function main() {
  const networkName = process.env.HARDHAT_NETWORK ?? "ganache";
  const networkConnection = await hardhat.network.connect({ networkName });
  const { ethers } = networkConnection;
  const contractAddress = process.env.RELEASE_CONTRACT;
  if (!contractAddress) {
    throw new Error("Set RELEASE_CONTRACT to the deployed RevokeRelease address");
  }

  const artifactId = ethers.id("demo-artifact");
  const artifactHash = ethers.id("demo-artifact-content");
  const sbomHash = ethers.id("demo-sbom-json");

  const contract = await ethers.getContractAt("RevokeRelease", contractAddress);

  const publishReceipt = await (await contract.publishRelease(artifactId, artifactHash, sbomHash)).wait();
  console.log(`Published demo release in tx ${publishReceipt?.hash}`);

  const verifyReceipt = await (
    await contract.verifyRelease(artifactId, "Demo SBOM ingest + verification")
  ).wait();
  console.log(`Verified demo release in tx ${verifyReceipt?.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

