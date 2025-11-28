const statusAccent = {
  Published: "tag-info",
  Verified: "tag-success",
  Revoked: "tag-danger",
  Unknown: "tag-muted",
};

const formatTimestamp = (value) => {
  if (!value) return "—";
  const date = new Date(value * 1000);
  return date.toLocaleString();
};

const ReleaseList = ({ releases, onSelect }) => {
  if (!releases?.length) {
    return (
      <div className="card subtle">
        <p>No releases published yet. Use the form to push SBOM metadata on-chain.</p>
      </div>
    );
  }
  return (
    <div className="card table-card">
      <div className="card-header">
        <h3>On-chain Software Catalog</h3>
        <p className="muted">Pulled directly from RevokeRelease events.</p>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Artifact ID</th>
              <th>Maintainer</th>
              <th>Status</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((release) => (
              <tr key={release.artifactId}>
                <td>
                  <code>{release.artifactId.slice(0, 10)}…</code>
                </td>
                <td>{release.maintainer}</td>
                <td>
                  <span className={`status-pill ${statusAccent[release.status]}`}>
                    {release.status}
                  </span>
                </td>
                <td>{formatTimestamp(release.publishedAt)}</td>
                <td>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => onSelect?.(release)}
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReleaseList;

