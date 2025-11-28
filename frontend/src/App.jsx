import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useSbomContract } from "./hooks/useSbomContract";
import UserVerifier from "./pages/UserVerifier";
import MaintainerConsole from "./pages/MaintainerConsole";
import HowItWorks from "./pages/HowItWorks";
import WalletStatus from "./components/WalletStatus";

const navItems = [
  { path: "/verify", label: "Verifier" },
  { path: "/maintain", label: "Maintainer Console" },
  { path: "/learn", label: "Help" },
];

const App = () => {
  const contractCtx = useSbomContract();

  return (
    <div className="page-shell">
      <header className="top-nav">
        {/* <div className="brand">
          <span className="brand-pill">S-SBOM</span>
          <div>
            <strong>Artifact Validator</strong>
            <p>Ganache network hooked to RevokeRelease</p>
          </div>
        </div> */}
        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className="nav-link">
              {item.label}
            </NavLink>
          ))}
        </nav>
        <WalletStatus
          account={contractCtx.account}
          onConnect={contractCtx.connectWallet}
          error={contractCtx.error}
        />
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/verify" replace />} />
          <Route path="/verify" element={<UserVerifier contractCtx={contractCtx} />} />
          <Route path="/maintain" element={<MaintainerConsole contractCtx={contractCtx} />} />
          <Route path="/learn" element={<HowItWorks />} />
          <Route path="*" element={<Navigate to="/verify" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

