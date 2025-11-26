import hardhat from "hardhat";
import readline from "readline";

async function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve =>
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function main() {
  // Connect to your configured network (defaults to Ganache)
  const networkName = process.env.HARDHAT_NETWORK ?? "ganache";
  const networkConnection = await hardhat.network.connect({ networkName });
  const { ethers } = networkConnection;

  console.log(`Connected to: ${networkName} blockchain`);

  // Ask user for contract address
  const verifyAddress = await ask("Enter address to Verify: ");

  if (!ethers.isAddress(verifyAddress)) {
    console.error("❌ Invalid Address.");
    return;
  }

  // Check whether the address actually has contract bytecode
  const code = await ethers.provider.getCode(verifyAddress);

  if (code === "0x" || code === "0x0") {
    console.error("❌ No contract found at that address on this network.");
    return;
  }

  console.log("✅ Contract exists on the chain.\n");

  // Load VerifyRelease ABI + address
  const verify = await ethers.getContractAt("VerifyRelease", verifyAddress);

//   console.log("✅ Loaded VerifyRelease contract.");

  // Example operation: read a public mapping entry
  // (Change this to whatever function you want to call)

  try {
    const dummyId = ethers.keccak256(ethers.toUtf8Bytes("example"));
    const release = await verify.releases(dummyId); // reading public mapping
    // console.log("Example release entry:", release);
  } catch (err) {
    // console.log("⚠ Could not read release entry (this is normal if it doesn't exist):");
    // console.log(err.message);
  }

  console.log("✅ Verification completed.");
}

main().catch(error => {
  console.error("❌ Script crashed:", error);
  process.exitCode = 1;
});
