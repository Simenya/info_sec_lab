// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VerifyRelease} from "./VerifyRelease.sol";

/**
 * @title RevokeRelease
 * @notice Final layer of the SBOM lifecycle that can invalidate releases when a CVE or tamper is discovered.
 */
contract RevokeRelease is VerifyRelease {
  event ReleaseRevoked(bytes32 indexed artifactId, address indexed actor, string reason);

  error ReleaseNotActive(bytes32 artifactId);

  constructor(address[] memory maintainers, address[] memory verifiers)
    VerifyRelease(maintainers, verifiers)
  {}

  function revokeRelease(bytes32 artifactId, string calldata reason)
    external
    onlyMaintainer
    returns (Release memory)
  {
    Release memory release = releases[artifactId];
    if (
      release.status == ReleaseStatus.Unknown || release.status == ReleaseStatus.Revoked
    ) revert ReleaseNotActive(artifactId);

    release.status = ReleaseStatus.Revoked;
    release.revokedAt = block.timestamp;
    release.lastVerificationNote = reason;

    // Once revoked we treat the release as no longer verified.
    release.verifiedAt = 0;

    releases[artifactId] = release;

    emit ReleaseRevoked(artifactId, msg.sender, reason);
    return release;
  }
}

