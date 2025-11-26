# SBOM Release Verification Architecture

This document walks through how the three contracts introduced in this repo work together, how Ganache fits into the picture, and what the React/SBOM tooling is expected to do in each stage.

## 1. PublishRelease.sol

1. Owner bootstraps the contract with a list of maintainers + verifiers (can be empty).  
2. Maintainers call `publishRelease(artifactId, artifactHash, sbomHash)` where each hash is a `bytes32` fingerprint (e.g. SHA-256 truncated to 32 bytes).  
3. The contract captures the caller address as the maintainer, stores hashes, and flags the status as `Published`.  
4. Events (`ReleasePublished`) are emitted so off-chain indexers (React client, SBOM service bus) can mirror the registry in real time.

> `artifactId` is intentionally decoupled from the hashes. A React UI can derive it from `artifactHash`, a package coordinate, or a semantic version string. Pick one deterministic scheme and stick to it across the stack.

## 2. VerifyRelease.sol

`VerifyRelease` inherits every capability from `PublishRelease` and adds:

1. Verifier management via the inherited `_setVerifier` helper.  
2. `verifyRelease(artifactId, note)` which:
   - Ensures a release exists and has not been revoked.  
   - Updates the `status` to `Verified`, writes the verification timestamp, and stores the last verifier note (SBOM digest reference, scan ID, etc.).  
   - Emits `ReleaseVerified` so downstream systems can mark the artifact as safe.

Maintainers remain the only accounts that can publish, but verifiers (SBOM scanners, automated workflows) can be a disjoint allow-list.

## 3. RevokeRelease.sol

`RevokeRelease` is the top-level contract you deploy. It inherits the previous layers and introduces:

1. `revokeRelease(artifactId, reason)` restricted to maintainers.  
2. The release status flips to `Revoked`, the verification timestamp resets, and `lastVerificationNote` doubles as a human-readable reason (e.g., CVE reference, tamper evidence).  
3. `ReleaseRevoked` event helps your React UI strike-through revoked releases and your SBOM CLI to fail builds.

Because solidity inheritance composes state, deploying `RevokeRelease` gives you the full lifecycle in one address while keeping each stage auditable.

## 4. Ganache + provided account

1. Start Ganache at `http://127.0.0.1:8545` and supply the private key stored in `keys_file.txt`.  
2. Export `GANACHE_RPC_URL` and `GANACHE_PRIVATE_KEY` so Hardhat can send transactions from that wallet.  
3. `scripts/deploy-release.ts` deploys `RevokeRelease` with the deployer as the first maintainer/verifier.  
4. `scripts/sbom-demo/seed-demo.ts` reuses the same signer to publish + verify demo data.

## 5. React + SBOM toolchain flow

1. **SBOM generator** hashes artifacts/SBOMs, calls `publishRelease`, and stores the resulting transaction hash alongside the generated SBOM ID.  
2. **SBOM scanner/verifier** ingests the SBOM output, runs policy engines, and if everything is clean, calls `verifyRelease` with a scan identifier inside the note.  
3. **React dashboard** subscribes to `ReleasePublished`, `ReleaseVerified`, and `ReleaseRevoked` events via ethers.js WebSocket provider or a lightweight indexer, displaying current status per artifact ID.  
4. If a vulnerability is detected later, a maintainer calls `revokeRelease`, which immediately downgrades the release and lets the UI/SBOM CLI warn teams.

Each step is deterministic, so you can reproduce state transitions by replaying events or querying `getRelease(artifactId)` at any time.

