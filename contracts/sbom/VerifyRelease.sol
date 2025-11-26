// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {PublishRelease} from "./PublishRelease.sol";

/**
 * @title VerifyRelease
 * @notice Extends publishing flows with verification logic so SBOM scanners can attest to releases.
 */
contract VerifyRelease is PublishRelease {
  event ReleaseVerified(bytes32 indexed artifactId, address indexed verifier, string note);

  error ReleaseNotFound(bytes32 artifactId);
  error ReleaseNotPublishable(bytes32 artifactId);

  constructor(address[] memory maintainers, address[] memory verifiers)
    PublishRelease(maintainers, verifiers)
  {}

  function verifyRelease(bytes32 artifactId, string calldata note)
    public
    onlyVerifier
    returns (Release memory)
  {
    Release memory release = releases[artifactId];
    if (release.status == ReleaseStatus.Unknown) revert ReleaseNotFound(artifactId);
    if (release.status == ReleaseStatus.Revoked) revert ReleaseNotPublishable(artifactId);

    release.status = ReleaseStatus.Verified;
    release.verifiedAt = block.timestamp;
    release.lastVerificationNote = note;

    releases[artifactId] = release;

    emit ReleaseVerified(artifactId, msg.sender, note);
    return release;
  }
}

