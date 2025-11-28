import React, { useState, useEffect } from "react";
import { ethers } from "ethers";


const CONTRACT_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"; 

const ABI = [
  "function verifyRelease(string version) view returns (tuple(string artifactHash, string sbomHash, address maintainer, bool isRevoked))"
];


const theme = {
  bg: "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)",
  cardBg: "rgba(30, 41, 59, 0.7)",
  glass: "backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  primary: "#3b82f6",     
  success: "#10b981",     
  danger: "#ef4444",     
  warning: "#f59e0b",    
  border: "1px solid rgba(148, 163, 184, 0.1)",
  glow: "0 0 20px rgba(59, 130, 246, 0.15)"
};

function App() {
  // --- LOGIC STATE ---
  const [version, setVersion] = useState("Antigravity-v2");
  const [fileHash, setFileHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  
  // --- UI STATE ---
  const [status, setStatus] = useState("IDLE"); // IDLE, LOADING, SUCCESS, ERROR, WARNING
  const [statusMsg, setStatusMsg] = useState("Ready to initialize scan...");
  const [report, setReport] = useState(null);
  const [sbomData, setSbomData] = useState(null);
  const [isHovering, setIsHovering] = useState(false); // For drag & drop effect

  // --- HELPER: HASHING ---
  const computeHash = async (buffer) => {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return "0x" + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // --- HANDLER: UPLOAD ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setFileSize((file.size / 1024).toFixed(2) + " KB");
      setStatus("LOADING");
      setStatusMsg("Calculating cryptographic fingerprint...");
      
      const buffer = await file.arrayBuffer();
      const hash = await computeHash(buffer);
      
      setFileHash(hash);
      setReport(null);
      setSbomData(null);
      setStatus("IDLE");
      setStatusMsg("Artifact hashed locally. Ready for blockchain verification.");
    }
  };

  // --- MAIN: VERIFY ---
  const verify = async () => {
    if (!fileHash) {
      setStatus("ERROR");
      setStatusMsg("No artifact detected. Please upload a file.");
      return;
    }

    try {
      // Direct connection (MetaMask-less)
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

      setStatus("LOADING");
      setStatusMsg("Querying Immutable Ledger...");

      // 1. Blockchain Query
      const record = await contract.verifyRelease(version);

      // 2. Hash Comparison
      const isSoftwareValid = record.artifactHash === fileHash;
      
      if (!isSoftwareValid) {
        setStatus("ERROR");
        setStatusMsg("CRITICAL: HASH MISMATCH. ARTIFACT IS TAMPERED.");
        return;
      }

      if (record.isRevoked) {
        setStatus("ERROR");
        setStatusMsg("REVOKED: Author has flagged this release as dangerous.");
        return;
      }

      // 3. Fetch SBOM (Simulated Server Request)
      setStatusMsg("Software Verified. Fetching Supply Chain Data...");
      
      let fetchedSbomHash = "";
      let parsedSbom = null;
      
      try {
        // Appending timestamp to prevent browser caching issues
        const response = await fetch("/sbom.json?t=" + new Date().getTime());
        const text = await response.text();
        
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        fetchedSbomHash = await computeHash(data);
        
        parsedSbom = JSON.parse(text);
      } catch (e) {
        console.error("SBOM Fetch Error", e);
      }

      // 4. Validate SBOM
      const isSbomValid = record.sbomHash === fetchedSbomHash;

      if (isSbomValid) {
        setStatus("SUCCESS");
        setStatusMsg("VERIFICATION COMPLETE: SYSTEM SECURE");
        setSbomData(parsedSbom.components || []);
        setReport({
          version: version,
          maintainer: record.maintainer,
          timestamp: new Date().toLocaleString(),
          sbomHash: record.sbomHash
        });
      } else {
        setStatus("WARNING");
        setStatusMsg("WARNING: ARTIFACT VALID, BUT SBOM INTEGRITY FAILED.");
      }

    } catch (err) {
      console.error(err);
      setStatus("ERROR");
      setStatusMsg("BLOCKCHAIN ERROR: Version ID not found in registry.");
    }
  };

  // ==========================================
  // 🖥️ UI COMPONENTS (STYLED)
  // ==========================================

  const Container = {
    minHeight: "100vh",
    background: theme.bg,
    color: theme.text,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  };

  const Card = {
    width: "100%",
    maxWidth: "800px",
    background: theme.cardBg,
    borderRadius: "16px",
    border: theme.border,
    boxShadow: theme.glow,
    backdropFilter: "blur(12px)",
    overflow: "hidden",
    position: "relative"
  };

  const Header = {
    padding: "30px",
    borderBottom: theme.border,
    background: "rgba(0,0,0,0.2)",
    textAlign: "center"
  };

  const StatusBanner = {
    padding: "15px",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: "1px",
    fontSize: "14px",
    background: status === "SUCCESS" ? "rgba(16, 185, 129, 0.2)" :
                status === "ERROR" ? "rgba(239, 68, 68, 0.2)" :
                status === "WARNING" ? "rgba(245, 158, 11, 0.2)" : "transparent",
    color: status === "SUCCESS" ? theme.success :
           status === "ERROR" ? theme.danger :
           status === "WARNING" ? theme.warning : theme.textMuted,
    borderBottom: theme.border,
    transition: "all 0.3s ease"
  };

  const Content = { padding: "40px" };

  const InputGroup = { marginBottom: "25px" };

  const Label = {
    display: "block",
    color: theme.textMuted,
    marginBottom: "10px",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    fontWeight: "bold"
  };

  const TextInput = {
    width: "100%",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid #334155",
    padding: "15px",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
    transition: "border 0.2s",
  };

  const DropZone = {
    border: isHovering ? `2px dashed ${theme.primary}` : "2px dashed #475569",
    background: isHovering ? "rgba(59, 130, 246, 0.05)" : "rgba(0,0,0,0.2)",
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.3s ease"
  };

  const Button = {
    width: "100%",
    padding: "18px",
    background: `linear-gradient(135deg, ${theme.primary} 0%, #2563eb 100%)`,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: status === "LOADING" ? "not-allowed" : "pointer",
    opacity: status === "LOADING" ? 0.7 : 1,
    boxShadow: "0 4px 15px rgba(37, 99, 235, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginTop: "20px",
    transition: "transform 0.1s"
  };

  // --- REPORT SECTION STYLES ---
  const TerminalWindow = {
    marginTop: "40px",
    background: "#0c0a09",
    borderRadius: "8px",
    border: "1px solid #333",
    fontFamily: "'Courier New', monospace",
    overflow: "hidden"
  };

  const TerminalHeader = {
    background: "#1c1917",
    padding: "10px 15px",
    display: "flex",
    gap: "8px",
    borderBottom: "1px solid #333"
  };

  const Dot = { width: "10px", height: "10px", borderRadius: "50%" };

  return (
    <div style={Container}>
      {/* GLOBAL CSS RESET & ANIMATIONS */}
      <style>{`
        body { margin: 0; padding: 0; box-sizing: border-box; }
        ::placeholder { color: #475569; }
        .glow-hover:hover { box-shadow: 0 0 25px rgba(59, 130, 246, 0.4); }
        .btn-press:active { transform: scale(0.98); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>

      <div style={Card} className="fade-in">
        {/* HEADER */}
        <div style={Header}>
          <h1 style={{ margin: 0, fontSize: "24px", letterSpacing: "1px" }}>
            <span style={{color: theme.primary}}>⛓️ SECURE</span> CHAIN
          </h1>
          <p style={{ margin: "5px 0 0", fontSize: "12px", color: theme.textMuted }}>
            Blockchain-Verified Supply Chain Audit
          </p>
        </div>

        {/* DYNAMIC STATUS BAR */}
        <div style={StatusBanner}>
          {status === "LOADING" ? "⚙️ PROCESSING..." : statusMsg}
        </div>

        <div style={Content}>
          
          {/* 1. VERSION INPUT */}
          <div style={InputGroup}>
            <label style={Label}>Target Release Version (Tag)</label>
            <input 
              style={TextInput}
              value={version} 
              onChange={e => setVersion(e.target.value)}
              placeholder="e.g. Antigravity-v1"
              onFocus={(e) => e.target.style.borderColor = theme.primary}
              onBlur={(e) => e.target.style.borderColor = "#334155"}
            />
          </div>

          {/* 2. FILE UPLOAD (DROPZONE) */}
          <div style={InputGroup}>
            <label style={Label}>Software Artifact (.exe, .pdf, .zip)</label>
            <div 
              style={DropZone} 
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <input 
                type="file" 
                onChange={handleFileUpload} 
                style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer"}} 
              />
              <div style={{fontSize: "40px", marginBottom: "10px", filter: "drop-shadow(0 0 10px rgba(59,130,246,0.5))"}}>
                {fileName ? "📄" : "📤"}
              </div>
              <h3 style={{margin: "0 0 5px", color: theme.text}}>
                {fileName || "Drag & Drop or Click to Upload"}
              </h3>
              <p style={{margin: 0, color: theme.textMuted, fontSize: "13px"}}>
                {fileName ? `Selected: ${fileSize}` : "SHA-256 Calculation happens locally in browser"}
              </p>
            </div>
          </div>

          {/* 3. VERIFY BUTTON */}
          <button 
            onClick={verify} 
            style={Button}
            className="glow-hover btn-press"
          >
            {status === "LOADING" ? "Verifying..." : "Initialize Verification Protocol"}
          </button>

          {/* 4. THE REPORT (TERMINAL STYLE) */}
          {report && sbomData && (
            <div style={TerminalWindow} className="fade-in">
              <div style={TerminalHeader}>
                <div style={{...Dot, background: "#ef4444"}}></div>
                <div style={{...Dot, background: "#f59e0b"}}></div>
                <div style={{...Dot, background: "#10b981"}}></div>
                <span style={{marginLeft: "10px", fontSize: "12px", color: "#666"}}>audit_report.log</span>
              </div>
              
              <div style={{padding: "20px", fontSize: "13px", lineHeight: "1.6"}}>
                <div style={{display: "flex", justifyContent: "space-between", borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "15px"}}>
                  <div>
                    <span style={{color: theme.textMuted}}>STATUS: </span>
                    <span style={{color: theme.success, fontWeight: "bold"}}>AUTHENTICATED</span>
                  </div>
                  <div style={{color: theme.textMuted}}>{report.timestamp}</div>
                </div>

                <div style={{marginBottom: "20px"}}>
                  <div style={{color: theme.primary, fontWeight: "bold", marginBottom: "5px"}}>{">"} RELEASE METADATA</div>
                  <div style={{paddingLeft: "15px", color: theme.textMuted}}>
                    <div>VERSION: <span style={{color: "#fff"}}>{report.version}</span></div>
                    <div>AUTHOR:  <span style={{color: "#fff"}}>{report.maintainer}</span></div>
                    <div>S-HASH:  <span style={{color: "#fff"}}>{report.sbomHash.substring(0, 20)}...</span></div>
                  </div>
                </div>

                <div>
                  <div style={{color: theme.primary, fontWeight: "bold", marginBottom: "10px"}}>{">"} SBOM COMPONENTS DETECTED</div>
                  <table style={{width: "100%", borderCollapse: "collapse", color: "#e2e8f0"}}>
                    <thead style={{textAlign: "left", color: theme.textMuted, borderBottom: "1px dashed #444"}}>
                      <tr>
                        <th style={{paddingBottom: "8px"}}>PKG_NAME</th>
                        <th style={{paddingBottom: "8px"}}>VERSION</th>
                        <th style={{paddingBottom: "8px"}}>TYPE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sbomData.map((item, idx) => (
                        <tr key={idx} style={{borderBottom: "1px solid #222"}}>
                          <td style={{padding: "8px 0"}}>{item.name}</td>
                          <td style={{padding: "8px 0", color: theme.warning}}>{item.version}</td>
                          <td style={{padding: "8px 0", color: theme.textMuted}}>{item.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sbomData.length === 0 && <div style={{color: theme.danger, marginTop: "10px"}}>! No dependency data found in manifest.</div>}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;