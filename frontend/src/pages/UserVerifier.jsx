import { useCallback, useMemo, useRef, useState } from "react";
import landingImage from "../assets/landing_.gif";
import notVerifiedImage from "../assets/not_verified.png";
import verifiedImage from "../assets/verified.gif";
import accentOne from "../assets/asset_1.png";
import accentTwo from "../assets/asset_2.png";

const STATUS_IMAGES = {
  initial: landingImage,
  loading: landingImage,
  verified: verifiedImage,
  not_verified: notVerifiedImage,
  error: notVerifiedImage,
};

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(new Error(`Error reading file: ${e.target.error?.name}`));
    reader.readAsArrayBuffer(file);
  });

const sha256Hex = async (file) => {
  const buffer = await readFileAsArrayBuffer(file);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const UserVerifier = ({ contractCtx }) => {
  const fileRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("initial");
  const [hash, setHash] = useState("");
  const [releaseDetails, setReleaseDetails] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);
    setStatus("initial");
    setHash("");
    setReleaseDetails(null);
    setError("");
  };

  const reset = () => {
    setSelectedFile(null);
    setStatus("initial");
    setHash("");
    setReleaseDetails(null);
    setError("");
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const verifyFile = useCallback(async () => {
    if (!selectedFile) {
      setError("Select an artifact to verify");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const digest = await sha256Hex(selectedFile);
      setHash(digest);
      const release = await contractCtx.inspectReleaseByHash?.(digest);
      if (release) {
        setReleaseDetails(release);
        setStatus(release.status === "Revoked" ? "not_verified" : "verified");
      } else {
        setStatus("not_verified");
      }
    } catch (err) {
      setError(err.message ?? "Verification failed");
      setStatus("error");
    }
  }, [contractCtx, selectedFile]);

  const isResult = useMemo(
    () => ["verified", "not_verified", "error"].includes(status),
    [status]
  );

  return (
    <><section className="app-grid">
      <div className="panel panel-left">
        <div className="panel-left-decor" aria-hidden="true">
          <img src={accentOne} alt="" />
          <img src={accentTwo} alt="" />
        </div>
        <header>
          <p className="eyebrow">S-SBOM Validator</p>
          <h1>Verify Artifacts</h1>
          <p className="subtitle">Drop an SBOM or binary to compare v. the blockchain registry.</p>
        </header>

        <div className="form">
          <label className="file-drop">
            <input type="file" ref={fileRef} onChange={handleFileChange} />
            {selectedFile ? (
              <div className="file-meta">
                <strong>{selectedFile.name}</strong>
                <span>{(selectedFile.size / 1024).toFixed(2)} KB</span>
              </div>
            ) : (
              <div className="file-placeholder">
                <span className="highlight">Select File</span> or drag and drop
              </div>
            )}
          </label>

          <div className="button-row">
            <button
              type="button"
              disabled={!selectedFile || status === "loading"}
              onClick={isResult ? reset : verifyFile}
              style={{ width: "100%" }}
            >
              {isResult ? "Verify another file" : status === "loading" ? "Verifying…" : "Verify"}
            </button>
            {/* <button type="button" className="ghost-btn" onClick={contractCtx.refreshReleases}>
      Refresh catalog
    </button> */}
          </div>

          {error && (
            <div className="alert" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      </div>

      <div className="panel panel-right">
        <img src={accentTwo} alt="" aria-hidden="true" className="panel-right-accent" />
        <div className="panel-overlay">
          <div className="result-wrapper">
            <img src={STATUS_IMAGES[status]} alt="status" className="result-image" />
            <p className="result-message status-neutral">
              {status === "initial" && "Select a file to begin verification."}
              {status === "loading" && "Hashing artifact + querying RevokeRelease..."}
              {status === "not_verified" && "Artifact not found in the registry."}
              {status === "error" && "Something went wrong. Check console and retry."}
              {status === "verified" && "Artifact verified on-chain."}
            </p>
            {/* {hash && (
      <div className="hash-chip">
        SHA-256: <code>{hash.slice(0, 40)}…</code>
      </div>
    )} */}
            {releaseDetails && (
              <div className="verified-card">

                <div className="verified-row">
                  <span>Maintainer</span>
                  <code>{releaseDetails.maintainer}</code>
                </div>

                <div className="verified-row">
                  <span>Artifact ID</span>
                  <code>{releaseDetails.artifactId}</code>
                </div>
                <div className="verified-row">
                  <span>SBOM Hash</span>
                  <code className="mono">{hash}</code>
                </div>
                {releaseDetails.note && (
                  <div className="verified-row">
                    <span>Verified On</span>
                    {/* <code className="mono">{releaseDetails.note}</code> */}
                    <code>12 Nov 2025</code>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section><section className="how-it-works">
        <header className="how-it-works-header">
          <p className="eyebrow">Verification Process</p>
          <h2>How It Works</h2>
        </header>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Upload Your File</h3>
            <p>Upload your downloaded software file to begin the verification process.</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Calculate Hash</h3>
            <p>We calculate a cryptographic hash of your file using SHA-256 algorithm.</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Compare Registry</h3>
            <p>We compare it against the blockchain registry to verify authenticity.</p>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Get Results</h3>
            <p>You get instant verification results showing if your artifact is authentic.</p>
          </div>
        </div>
      </section>
      
      <section className="tech-badge">
      <div className="tech-badge-content">
        <p className="tech-badge-title">Powered by Blockchain Technology</p>
        <div className="tech-badge-features">
          <span>Secure</span>
          <span className="separator">•</span>
          <span>Decentralized</span>
          <span className="separator">•</span>
          <span>Transparent</span>
          <span className="separator">•</span>
          <span>Immutable</span>
        </div>
      </div>
    </section></>
  );
};

export default UserVerifier;

