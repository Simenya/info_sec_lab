const hre = require("hardhat");
const fs = require("fs");
const crypto = require("crypto");

const CONTRACT_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"; 

const VERSION_NAME = "Antigravity-v2";   
const FILE_PATH    = "./Antigravity.exe";  // <--- Ensure this points to the file in ROOT
const SBOM_PATH    = "./client/public/sbom.json";


async function main() {
  console.log(`Preparing to register '${FILE_PATH}' as version '${VERSION_NAME}'...`);

  // 2. CALCULATE HASHES LOCALLY
  // (This is the exact same math as your previous script)
  function getHash(path) {
    const buffer = fs.readFileSync(path);
    return "0x" + crypto.createHash("sha256").update(buffer).digest("hex");
  }

  const artifactHash = getHash(FILE_PATH);
  const sbomHash = getHash(SBOM_PATH);

  console.log("--- FINGERPRINTS GENERATED ---");
  console.log("File Hash:", artifactHash);
  console.log("SBOM Hash:", sbomHash);

  // 3. CONNECT TO EXISTING CONTRACT (The Key Change)
  // Instead of .deploy(), we use .attach()
  const ArtifactRegistry = await hre.ethers.getContractFactory("ArtifactRegistry");
  const registry = ArtifactRegistry.attach(CONTRACT_ADDRESS);

  // 4. PUBLISH THE NEW ENTRY
  console.log("Writing to Blockchain...");
  const tx = await registry.publishRelease(VERSION_NAME, artifactHash, sbomHash);
  await tx.wait();

  console.log("-----------------------------");
  console.log(`✅ Success! Version '${VERSION_NAME}' is now on the blockchain.`);
//   console.log("You can now go to your website and verify ");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});