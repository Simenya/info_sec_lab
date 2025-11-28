const shorten = (value) => {
  if (!value) return "";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

const WalletStatus = ({ account, onConnect, error }) => {
  return (
    <div className="wallet-cluster">
      {account ? (
        <span className="wallet-pill">Maintainer: {shorten(account)}</span>
      ) : (
        <button className="ghost-btn" type="button" onClick={onConnect}>
          Connect Wallet
        </button>
      )}
      {error && <span className="wallet-error">{error}</span>}
    </div>
  );
};

export default WalletStatus;

