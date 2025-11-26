import { expect } from "chai";
const hardhatModule = await import("hardhat");
const hre = "default" in hardhatModule ? hardhatModule.default : hardhatModule;
const networkConnection = await hre.network.connect();
const { ethers } = networkConnection;

describe("SBOM Release lifecycle", () => {
  const artifactId = ethers.id("sbom-release-1");
  const artifactHash = ethers.id("artifact.bin");
  const sbomHash = ethers.id("sbom.json");

  async function deployFixture() {
    const [owner, verifier] = await ethers.getSigners();
    const ReleaseFactory = await ethers.getContractFactory("RevokeRelease");
    const contract = await ReleaseFactory.deploy([owner.address], [owner.address]);
    await contract.waitForDeployment();
    return { contract, owner, verifier };
  }

  it("publishes, verifies, and revokes a release", async () => {
    const { contract, owner, verifier } = await deployFixture();

    await contract.connect(owner).setMaintainer(verifier.address, true);
    await contract.connect(owner).setVerifier(verifier.address, true);

    const publishTx = await contract
      .connect(verifier)
      .publishRelease(artifactId, artifactHash, sbomHash);
    await publishTx.wait();

    const published = await contract.getRelease(artifactId);
    expect(published.maintainer).to.equal(verifier.address);
    expect(published.status).to.equal(1n); // Published enum

    const verifyTx = await contract
      .connect(verifier)
      .verifyRelease(artifactId, "Automated SBOM scan");
    await verifyTx.wait();

    const verified = await contract.getRelease(artifactId);
    expect(verified.status).to.equal(2n); // Verified enum
    expect(verified.verifiedAt).to.be.gt(0n);

    const revokeTx = await contract
      .connect(verifier)
      .revokeRelease(artifactId, "CVE-2025-0001 high risk");
    await revokeTx.wait();

    const revoked = await contract.getRelease(artifactId);
    expect(revoked.status).to.equal(3n); // Revoked enum
    expect(revoked.revokedAt).to.be.gt(0n);
    expect(revoked.verifiedAt).to.equal(0n);
  });

  it("blocks duplicate publishes", async () => {
    const { contract, owner } = await deployFixture();
    await contract.publishRelease(artifactId, artifactHash, sbomHash);

    await expect(
      contract.connect(owner).publishRelease(artifactId, artifactHash, sbomHash)
    ).to.be.revertedWithCustomError(contract, "ReleaseAlreadyExists");
  });
});

