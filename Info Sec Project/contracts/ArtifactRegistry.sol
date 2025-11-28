// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ArtifactRegistry {
    // A. DEFINING THE RECORD
    struct Release {
        string artifactHash; // Fingerprint of software.txt
        string sbomHash;     // Fingerprint of sbom.json
        address maintainer;  // Who posted this?
        bool isRevoked;      // Is it dangerous?
    }

    // B. THE STORAGE (The Stone Board)
    mapping(string => Release) public releases;

    // C. THE FUNCTIONS
    // 1. Publish: Write to the board
    function publishRelease(string memory _version, string memory _artifactHash, string memory _sbomHash) public {
        releases[_version] = Release({
            artifactHash: _artifactHash,
            sbomHash: _sbomHash,
            maintainer: msg.sender,
            isRevoked: false
        });
    }

    // 2. Verify: Read from the board
    function verifyRelease(string memory _version) public view returns (Release memory) {
        return releases[_version];
    }
}