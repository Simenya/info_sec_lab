const hre = require("hardhat");
const fs = require("fs");
const crypto = require("crypto");

async function main() {
  // 1. CALCULATE HASHES LOCALLY
  // We read the files we created in Phase 1 and get their fingerprints
  const softwareBuffer = fs.readFileSync("./LLM Interview Questions.pdf");
  const sbomBuffer = fs.readFileSync("./sbom.json");

  // Create SHA-256 hashes
  const artifactHash = "0x" + crypto.createHash("sha256").update(softwareBuffer).digest("hex");
  const sbomHash = "0x" + crypto.createHash("sha256").update(sbomBuffer).digest("hex");

  console.log("--- LOCAL DATA CALCULATED ---");
  console.log("Software Hash:", artifactHash);
  console.log("SBOM Hash:    ", sbomHash);

  // 2. DEPLOY THE CONTRACT
  const ArtifactRegistry = await hre.ethers.getContractFactory("ArtifactRegistry");
  const registry = await ArtifactRegistry.deploy();
  await registry.waitForDeployment(); // Wait for it to be mined
  
  const contractAddress = await registry.getAddress();
  console.log("-----------------------------");
  console.log("✅ Contract Deployed to:", contractAddress);

  // 3. PUBLISH THE RELEASE (The "Write" Operation)
  // We are telling the smart contract: "Version 1.0 has these hashes."
  const tx = await registry.publishRelease("1.0", artifactHash, sbomHash);
  await tx.wait();

  console.log("✅ Release v1.0 Published on Blockchain!");
  console.log("-----------------------------");
  console.log("SAVE THIS ADDRESS ", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});