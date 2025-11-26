// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title PublishRelease
 * @notice Base contract responsible for onboarding SBOM maintainers and persisting SBOM + artifact fingerprints.
 */
contract PublishRelease {
  enum ReleaseStatus {
    Unknown,
    Published,
    Verified,
    Revoked
  }

  struct Release {
    address maintainer;
    bytes32 artifactHash;
    bytes32 sbomHash;
    ReleaseStatus status;
    uint256 publishedAt;
    uint256 verifiedAt;
    uint256 revokedAt;
    string lastVerificationNote;
  }

  address public owner;
  mapping(address => bool) internal maintainers;
  mapping(address => bool) internal verifiers;
  mapping(bytes32 => Release) internal releases;

  event MaintainerUpdated(address indexed maintainer, bool allowed);
  event VerifierUpdated(address indexed verifier, bool allowed);
  event ReleasePublished(
    bytes32 indexed artifactId,
    address indexed maintainer,
    bytes32 artifactHash,
    bytes32 sbomHash
  );

  error NotOwner();
  error NotMaintainer();
  error NotVerifier();
  error ReleaseAlreadyExists(bytes32 artifactId);
  error EmptyIdentifier();

  modifier onlyOwner() {
    if (msg.sender != owner) revert NotOwner();
    _;
  }

  modifier onlyMaintainer() {
    if (!maintainers[msg.sender]) revert NotMaintainer();
    _;
  }

  modifier onlyVerifier() {
    if (!verifiers[msg.sender]) revert NotVerifier();
    _;
  }

  constructor(address[] memory initialMaintainers, address[] memory initialVerifiers) {
    owner = msg.sender;
    maintainers[owner] = true;
    verifiers[owner] = true;

    for (uint256 i = 0; i < initialMaintainers.length; i++) {
      _setMaintainer(initialMaintainers[i], true);
    }

    for (uint256 i = 0; i < initialVerifiers.length; i++) {
      _setVerifier(initialVerifiers[i], true);
    }
  }

  function publishRelease(
    bytes32 artifactId,
    bytes32 artifactHash,
    bytes32 sbomHash
  ) public onlyMaintainer returns (Release memory) {
    if (artifactId == bytes32(0)) revert EmptyIdentifier();
    if (releases[artifactId].status != ReleaseStatus.Unknown) {
      revert ReleaseAlreadyExists(artifactId);
    }

    Release memory release = Release({
      maintainer: msg.sender,
      artifactHash: artifactHash,
      sbomHash: sbomHash,
      status: ReleaseStatus.Published,
      publishedAt: block.timestamp,
      verifiedAt: 0,
      revokedAt: 0,
      lastVerificationNote: ""
    });

    releases[artifactId] = release;

    emit ReleasePublished(artifactId, msg.sender, artifactHash, sbomHash);
    return release;
  }

  function getRelease(bytes32 artifactId) public view returns (Release memory) {
    return releases[artifactId];
  }

  function isMaintainer(address account) public view returns (bool) {
    return maintainers[account];
  }

  function isVerifier(address account) public view returns (bool) {
    return verifiers[account];
  }

  function setMaintainer(address maintainer, bool allowed) external onlyOwner {
    _setMaintainer(maintainer, allowed);
  }

  function setVerifier(address verifier, bool allowed) external onlyOwner {
    _setVerifier(verifier, allowed);
  }

  function _setMaintainer(address maintainer, bool allowed) internal {
    maintainers[maintainer] = allowed;
    emit MaintainerUpdated(maintainer, allowed);
  }

  function _setVerifier(address verifier, bool allowed) internal {
    verifiers[verifier] = allowed;
    emit VerifierUpdated(verifier, allowed);
  }
}

