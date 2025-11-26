# SBOM Release Verification Chain

This Hardhat 3 project bootstraps the smart-contract layer for an SBOM (Software Bill of Materials) artifact verification tool.  
Three composable contracts — `PublishRelease`, `VerifyRelease`, and `RevokeRelease` — build on top of each other to cover the full lifecycle:

1. **publishRelease**: Maintainers push an artifact hash + SBOM hash on-chain.  
2. **verifyRelease**: Auditors/SBOM scanners attest to a published artifact and surface the metadata back to clients.  
3. **revokeRelease**: Maintainers can invalidate compromised artifacts so downstream tools and the React dashboard can react instantly.

`RevokeRelease` inherits the other contracts, so deploying it gives you the full API surface while keeping the code modular and easy to audit.

## Repository layout

```
contracts/
  sbom/
    PublishRelease.sol      # Maintainer + verifier onboarding + release persistence
    VerifyRelease.sol       # Verification flow w/ notes + timestamps
    RevokeRelease.sol       # Revocation flow that flips the verified state
scripts/
  deploy-release.ts         # Deploys RevokeRelease to any configured network
  sbom-demo/seed-demo.ts    # Publishes & verifies demo data for UI wiring
sbom-demo/
  inputs/sample-artifact.json
  outputs/sample-sbom.json  # Placeholder payload the SBOM generator will replace
test/
  sbom/ReleaseLifecycle.ts  # end-to-end publish → verify → revoke coverage
```

## Prerequisites

- Node.js 20+
- npm
- Ganache (GUI) configured with the developer key stored in `.env`

```shell
npm install
```

## Environment configuration

Create a `.env` (or use `hardhat keystore`) and point the Ganache RPC plus private key that exists in `keys_file.txt`:

```shell
setx GANACHE_RPC_URL http://127.0.0.1:8545
setx GANACHE_PRIVATE_KEY <Private_Key from keys_file.txt>
```

The same pattern works for `SEPOLIA_*` if you later connect a testnet faucet account.

## Running a local Ganache instance

```shell
ganache --server.host 127.0.0.1 --wallet.privateKey <Private_Key from keys_file.txt> --wallet.balance 0x3635C9ADC5DEA00000
```

Replace the balance as needed. Once Ganache is up, Hardhat can target it via the new `ganache` network block inside `hardhat.config.ts`.

## Compile + test

```shell
npx hardhat compile
npx hardhat test            # runs the mocha/TypeScript suite
npx hardhat test solidity   # optional, only runs if you add Foundry .t.sol tests
```

`test/sbom/ReleaseLifecycle.ts` (Mocha) asserts:
- Maintainers can publish exactly once per artifact ID.
- Verifiers extract the maintainer, artifact hash, and SBOM hash back out of the chain.
- Revocation clears the verification timestamp so the React dashboard can disable “verified” badges.

`npx hardhat test solidity` currently reports “0 passing” because there are no Foundry-style `.t.sol` tests in this repo. Add files under `contracts/` or `test/solidity/` if you want Hardhat to execute Solidity/Foundry cases in addition to the TS suite.

## Deploy to Ganache

```shell
npx hardhat run scripts/deploy-all.ts --network ganache
```

This deploys `PublishRelease`, `VerifyRelease`, and `RevokeRelease` independently so you can interact with each address as needed (even though `RevokeRelease` already inherits the full API).

After deployment, export the address for later scripts:

```shell
setx RELEASE_CONTRACT <0xDeployedAddress>
```

## Seed demo SBOM data

```shell
npx hardhat run scripts/sbom-demo/seed-demo.ts --network ganache
```

This script ingests the demo payloads in `sbom-demo/` and calls `publishRelease` + `verifyRelease` so you have deterministic data while wiring up the React front end or the SBOM generator.

> Tip: if you want to see transactions inside the Ganache GUI, make sure the network is running before executing `hardhat run … --network ganache`. Hardhat defaults to an in-memory chain unless you pass `--network`, so deployments/tests will not show up in Ganache unless you target it explicitly.

## Next steps for the React + SBOM tooling

- **React client**: use the ABI from `artifacts/contracts/sbom/RevokeRelease.sol/RevokeRelease.json` and read `getRelease(artifactId)` to render maintainer/verification state.  
- **SBOM CLI/tooling**: hook your generator so it writes files into `sbom-demo/inputs` and `sbom-demo/outputs`, hashes them, and then calls `publishRelease` programmatically (refer to `scripts/sbom-demo/seed-demo.ts` for scaffolding).  
- **Automation**: extend the demo script to watch for CVE feeds and call `revokeRelease` automatically when a CVE references a tracked artifact.

This structure keeps responsibilities isolated and ready for team collaboration while leaving clear extension points for the rest of the stack.
