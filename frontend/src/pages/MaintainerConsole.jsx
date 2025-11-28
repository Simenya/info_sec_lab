import { useMemo, useRef, useState } from "react";
import ReleaseList from "../components/ReleaseList";

const tabs = [
  { id: "publish", label: "Publish" },
  { id: "revoke", label: "Revoke" },
  { id: "releases", label: "Published" },
];

const statusAccent = {
  Published: "tag-info",
  Verified: "tag-success",
  Revoked: "tag-danger",
  Unknown: "tag-muted",
};

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(new Error(`Unable to read file: ${e.target.error?.name}`));
    reader.readAsArrayBuffer(file);
  });

const sha256Hex = async (file) => {
  const buffer = await readFileAsArrayBuffer(file);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const formatTimestamp = (value) => {
  if (!value) return "—";
  return new Date(value * 1000).toLocaleString();
};

const MaintainerConsole = ({ contractCtx }) => {
  const [activeTab, setActiveTab] = useState("publish");
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [hashingArtifact, setHashingArtifact] = useState(false);
  const [artifactLabel, setArtifactLabel] = useState("");
  const [artifactDigest, setArtifactDigest] = useState("");
  const [artifactMeta, setArtifactMeta] = useState(null);
  const [revokeForm, setRevokeForm] = useState({ artifactIdHex: "", reason: "" });

  const artifactInputRef = useRef(null);

  const contractAddress = import.meta.env.VITE_RELEASE_CONTRACT ?? "missing";
  const rpcUrl = import.meta.env.VITE_GANACHE_RPC_URL ?? "http://127.0.0.1:7545";

  const resetPublish = () => {
    setArtifactLabel("");
    setArtifactDigest("");
    setArtifactMeta(null);
    if (artifactInputRef.current) artifactInputRef.current.value = "";
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setArtifactMeta(null);
      setArtifactDigest("");
      return;
    }

    setHashingArtifact(true);
    setNotice("");
    try {
      const digest = await sha256Hex(file);
      setArtifactMeta({ name: file.name, size: file.size });
      setArtifactDigest(digest);
    } catch (error) {
      setNotice(error.message ?? "Failed to hash file");
    } finally {
      setHashingArtifact(false);
    }
  };

  const canPublish = artifactLabel && artifactDigest && !pending;

  const handlePublish = async (event) => {
    event.preventDefault();
    if (!canPublish) return;
    setPending("publish");
    setNotice("");
    try {
      const artifactId = await contractCtx.publishRelease({
        artifactLabel,
        artifactHashHex: artifactDigest,
        sbomHashHex: artifactDigest,
      });
      setNotice(`Release ${artifactLabel} published (id: ${artifactId.slice(0, 10)}…)`);
      resetPublish();
    } catch (error) {
      setNotice(error.message ?? "Publish failed");
    } finally {
      setPending("");
    }
  };

  const handleRevoke = async (event) => {
    event.preventDefault();
    if (!revokeForm.artifactIdHex || !revokeForm.reason) return;
    setPending("revoke");
    setNotice("");
    try {
      await contractCtx.revokeRelease(revokeForm);
      setNotice("Release revoked successfully");
      setRevokeForm({ artifactIdHex: "", reason: "" });
    } catch (error) {
      setNotice(error.message ?? "Revocation failed");
    } finally {
      setPending("");
    }
  };

  const selectRelease = (release) => {
    setRevokeForm({ artifactIdHex: release.artifactId, reason: "" });
    setActiveTab("revoke");
  };

  const releases = useMemo(() => contractCtx.releases ?? [], [contractCtx.releases]);

  return (
    <section className="console-shell">
      <header className="console-header">
        <div>
          <p className="eyebrow">Maintainer console</p>
          {/* <h2>Publish + revoke SBOM entries</h2> */}
          <p className="muted">
            Contract: <code>{contractAddress}</code> · RPC: <code>{rpcUrl}</code>
          </p>
        </div>
        <div className="console-stat">
          <span>Catalog entries</span>
          <strong>{releases.length}</strong>
        </div>
      </header>

      <div className="console-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeTab ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="banner">
          <strong>Status:</strong> {notice}
        </div>
      )}

      <div className="console-content">
        {activeTab === "publish" && (
          <form className="card console-card" onSubmit={handlePublish}>
            <h3>Publish release</h3>
            <p className="muted">
              Upload the artifact to be published.
            </p>

            <label>
              Artifact label
              <input
                required
                value={artifactLabel}
                onChange={(e) => setArtifactLabel(e.target.value)}
                placeholder="e.g. demo-artifact@1.0.0"
              />
            </label>

            <div className="upload-field">
              <p>Artifact binary</p>
              <label className="file-drop">
                <input ref={artifactInputRef} type="file" onChange={handleFileChange} />
                {artifactMeta ? (
                  <div className="file-meta">
                    <strong>{artifactMeta.name}</strong>
                    <span>{(artifactMeta.size / 1024).toFixed(2)} KB</span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <span className="highlight">Select artifact</span> or drag + drop
                  </div>
                )}
              </label>
              <div className="hash-chip">
                {hashingArtifact
                  ? "Hashing artifact…"
                  : artifactDigest
                  ? `SHA-256: ${artifactDigest.slice(0, 40)}…`
                  : "Awaiting file"}
              </div>
            </div>

            <button type="submit" disabled={!canPublish}>
              {pending === "publish" ? "Publishing…" : "Publish to chain"}
            </button>
          </form>
        )}

        {activeTab === "revoke" && (
          <form className="card console-card" onSubmit={handleRevoke}>
            <h3>Revoke release</h3>
            <p className="muted">
              Provide the artifact id (bytes32) currently registered on-chain plus a short reason or CVE link.
            </p>

            <label>
              Artifact ID (bytes32)
              <input
                required
                value={revokeForm.artifactIdHex}
                onChange={(e) => setRevokeForm({ ...revokeForm, artifactIdHex: e.target.value })}
                placeholder="0x..."
              />
            </label>

            <label>
              Reason / reference link
              <input
                required
                value={revokeForm.reason}
                onChange={(e) => setRevokeForm({ ...revokeForm, reason: e.target.value })}
                placeholder="CVE-2025-0001 tamper event"
              />
            </label>

            <button type="submit" disabled={pending === "revoke"}>
              {pending === "revoke" ? "Revoking…" : "Revoke release"}
            </button>
          </form>
        )}

        {activeTab === "releases" && (
          <div className="card console-card">
            <div className="console-list-head">
              <div>
                <h3>Published artifacts</h3>
                <p className="muted">Name, publish date, and current status.</p>
              </div>
              <button type="button" className="ghost-btn" onClick={contractCtx.refreshReleases}>
                Refresh
              </button>
            </div>

            {!releases.length && (
              <div className="subtle card">
                <p>No artifacts found. Publish an SBOM to populate the catalog.</p>
              </div>
            )}

            {releases.length > 0 && (
              <ul className="artifact-list">
                {releases.map((release) => (
                  <li key={release.artifactId}>
                    <div className="artifact-row">
                      <div>
                        <strong>{release.artifactId.slice(0, 10)}…</strong>
                        <p className="muted">{formatTimestamp(release.publishedAt)}</p>
                      </div>
                      <div className="artifact-status">
                        <span className={`status-pill ${statusAccent[release.status]}`}>
                          {release.status}
                        </span>
                        <button type="button" className="ghost-btn" onClick={() => selectRelease(release)}>
                          Revoke
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {activeTab !== "releases" && (
        <div className="console-secondary">
          <ReleaseList releases={releases} onSelect={selectRelease} />
        </div>
      )}
    </section>
  );
};

export default MaintainerConsole;

