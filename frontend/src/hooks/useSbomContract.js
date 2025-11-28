import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import RevokeReleaseAbi from "../abi/RevokeRelease.json";

const DEMO_RELEASE_DATA = [
  {
    hash: "deed125d489b65fac8f421a3ad8b6502b94add8796eaca383da2ee52b585c04c",
    maintainer: "Waran Inc",
    chainId: "0x3e94393cb11549714cb85c3b0dcac7862ab39649dff018725e1b938528f26aed",
    label: "waran-demo@1.0.0",
  },
  {
    hash: "4a07f1d3ce40b0976588a841f35122e6039a3b4dcdd32b08d46092d3c521e340",
    maintainer: "Microsoft Inc",
    chainId: "0x79e2f7a9eddbbdbea1a82181f766022028350d1d47062c396d3c4c814cce050e",
    label: "msoft-demo@1.0.0",
  },
  {
    hash: "47d832093731e13f1b143c1962cb0a790dcdc6a76ecf0fde618fcd89516f6140",
    maintainer: "Google",
    chainId: "0x1eaaaa48b71e274cccd309edd1a60ab87338633bf0c1b1cdd83cd0670b7fb406",
    label: "google-demo@1.0.0",
  },
];

const STATUS_LABELS = ["Unknown", "Published", "Verified", "Revoked"];

const normalizeBytes32 = (value) => {
  if (!value) {
    throw new Error("Hash value is required");
  }
  const prefixed = value.startsWith("0x") ? value : `0x${value}`;
  const bytes = ethers.getBytes(prefixed);
  if (bytes.length !== 32) {
    throw new Error("Hash must resolve to exactly 32 bytes (SHA-256)");
  }
  return ethers.hexlify(bytes);
};

const createDemoReleases = () => {
  const now = Math.floor(Date.now() / 1000);

  return DEMO_RELEASE_DATA.map((entry, index) => {
    try {
      const digest = normalizeBytes32(entry.hash.startsWith("0x") ? entry.hash : `0x${entry.hash}`);
      const artifactId = ethers.id(`${entry.maintainer}-${entry.hash}`);
      return {
        artifactId,
        maintainer: entry.maintainer,
        artifactHash: digest,
        sbomHash: digest,
        statusCode: 2,
        status: STATUS_LABELS[2],
        publishedAt: now - (index + 1) * 86400,
        verifiedAt: now - (index + 1) * 86000,
        revokedAt: 0,
        note: `Verified on ${entry.chainId}`,
        chainId: entry.chainId,
        demo: true,
      };
    } catch (error) {
      console.warn("Failed to normalize demo hash", error);
      return null;
    }
  }).filter(Boolean);
};

export const useSbomContract = () => {
  const contractAddress = import.meta.env.VITE_RELEASE_CONTRACT;
  const rpcUrl = import.meta.env.VITE_GANACHE_RPC_URL ?? "http://127.0.0.1:7545";

  const demoReleases = useMemo(() => createDemoReleases(), []);

  const [state, setState] = useState({
    account: "",
    provider: null,
    signer: null,
    contract: null,
    releases: demoReleases,
    loading: false,
    error: "",
    demoMode: !contractAddress,
  });

  const readOnlyContract = useMemo(() => {
    if (!contractAddress) return null;
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      return new ethers.Contract(contractAddress, RevokeReleaseAbi, provider);
    } catch (error) {
      console.error("Read-only provider failed", error);
      return null;
    }
  }, [contractAddress, rpcUrl]);

  const setError = useCallback((error) => {
    setState((prev) => ({ ...prev, error: error?.message ?? String(error) }));
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error("A browser wallet (MetaMask) is required");
      }
      if (!contractAddress) {
        throw new Error("VITE_RELEASE_CONTRACT env is missing");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, RevokeReleaseAbi, signer);
      setState((prev) => ({
        ...prev,
        account: signer.address,
        provider,
        signer,
        contract,
        error: "",
      }));
    } catch (error) {
      setError(error);
    }
  }, [contractAddress, setError]);

  const getActiveContract = useCallback(() => {
    const instance = state.contract ?? readOnlyContract;
    if (!instance) {
      throw new Error("Contract address not configured");
    }
    return instance;
  }, [state.contract, readOnlyContract]);

  const refreshReleases = useCallback(async () => {
    if (!contractAddress) {
      setState((prev) => ({
        ...prev,
        releases: demoReleases,
        loading: false,
        error: "",
        demoMode: true,
      }));
      return;
    }

    const contract = getActiveContract();
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const publishedEvents = await contract.queryFilter(contract.filters.ReleasePublished());
      const unique = new Map();
      for (const event of publishedEvents) {
        const [artifactId, maintainer, artifactHash, sbomHash] = event.args;
        unique.set(artifactId, {
          artifactId,
          maintainer,
          artifactHash,
          sbomHash,
        });
      }
      const enriched = [];
      for (const [artifactId, info] of unique.entries()) {
        const release = await contract.getRelease(artifactId);
        enriched.push({
          artifactId,
          maintainer: release.maintainer,
          artifactHash: info.artifactHash,
          sbomHash: info.sbomHash,
          statusCode: Number(release.status),
          status: STATUS_LABELS[Number(release.status)] ?? "Unknown",
          publishedAt: Number(release.publishedAt),
          verifiedAt: Number(release.verifiedAt),
          revokedAt: Number(release.revokedAt),
          note: release.lastVerificationNote,
        });
      }
      setState((prev) => ({
        ...prev,
        releases: [...demoReleases, ...enriched],
        loading: false,
        error: "",
        demoMode: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        releases: demoReleases,
        demoMode: true,
      }));
      setError(error);
    }
  }, [contractAddress, demoReleases, getActiveContract, setError]);

  useEffect(() => {
    if (contractAddress) {
      refreshReleases();
    }
  }, [contractAddress, refreshReleases]);

  const publishRelease = useCallback(
    async ({ artifactLabel, artifactHashHex, sbomHashHex }) => {
      if (!state.contract) {
        throw new Error("Connect a maintainer wallet to publish");
      }
      const artifactId = ethers.id(artifactLabel.trim());
      const artifactHash = normalizeBytes32(artifactHashHex);
      const sbomHash = normalizeBytes32(sbomHashHex);

      const tx = await state.contract.publishRelease(artifactId, artifactHash, sbomHash);
      await tx.wait();
      await refreshReleases();
      return artifactId;
    },
    [state.contract, refreshReleases]
  );

  const verifyRelease = useCallback(
    async ({ artifactIdHex, note }) => {
      if (!state.contract) {
        throw new Error("Connect a verifier wallet to mark releases verified");
      }
      const artifactId = normalizeBytes32(artifactIdHex);
      const tx = await state.contract.verifyRelease(artifactId, note ?? "Manual verification");
      await tx.wait();
      await refreshReleases();
    },
    [state.contract, refreshReleases]
  );

  const revokeRelease = useCallback(
    async ({ artifactIdHex, reason }) => {
      if (!state.contract) {
        throw new Error("Connect a maintainer wallet to revoke releases");
      }
      const artifactId = normalizeBytes32(artifactIdHex);
      const tx = await state.contract.revokeRelease(artifactId, reason ?? "Revoked via UI");
      await tx.wait();
      await refreshReleases();
    },
    [state.contract, refreshReleases]
  );

  const inspectReleaseByHash = useCallback(
    async (artifactHashHex) => {
      const normalizedHash = normalizeBytes32(artifactHashHex);
      const matching = state.releases.find((entry) => entry.artifactHash === normalizedHash);
      if (!matching) {
        return null;
      }

      if (matching.demo || !contractAddress) {
        return {
          artifactId: matching.artifactId,
          maintainer: matching.maintainer,
          status: matching.status ?? "Verified",
          artifactHash: normalizedHash,
          sbomHash: matching.sbomHash ?? normalizedHash,
          note: matching.note ?? "",
          publishedAt: matching.publishedAt ?? 0,
          verifiedAt: matching.verifiedAt ?? 0,
          revokedAt: matching.revokedAt ?? 0,
          chainId: matching.chainId,
        };
      }

      const contract = getActiveContract();
      const release = await contract.getRelease(matching.artifactId);
      return {
        artifactId: matching.artifactId,
        maintainer: release.maintainer,
        status: STATUS_LABELS[Number(release.status)] ?? "Unknown",
        artifactHash: normalizedHash,
        sbomHash: release.sbomHash,
        note: release.lastVerificationNote,
        publishedAt: Number(release.publishedAt),
        verifiedAt: Number(release.verifiedAt),
        revokedAt: Number(release.revokedAt),
      };
    },
    [contractAddress, getActiveContract, state.releases]
  );

  return {
    ...state,
    connectWallet,
    publishRelease,
    verifyRelease,
    revokeRelease,
    inspectReleaseByHash,
    refreshReleases,
  };
};

