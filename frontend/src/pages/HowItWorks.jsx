const steps = [
  {
    title: "Standard Users",
    body: "Upload or drag & drop an artifact file, then click Verify. \n\n The tool hashes the file and checks the registry. The right panel instantly shows the status: Verified, Not Verified, or Revoked.",
  },
  {
    title: "Maintainers",
    body: "Use one of the three tools: (a) Publish – upload artifact + SBOM to register a new release; (b) Revoke – mark an existing release as revoked; (c) Artifact List – view all stored artifacts and their statuses.",
  },
];

const HowItWorks = () => (
  <section className="card howto-card">
    <header className="card-header">
      <p className="eyebrow">Getting Started</p>
      <h2>End-to-end SBOM workflow</h2>
      
    </header>
    <ol className="timeline">
      {steps.map((step) => (
        <li key={step.title}>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </li>
      ))}
    </ol>
    <div className="card grid-span-2 subtle">
      <h3>Why this tool exists</h3>
      <ul>
        <li>
          Built to help <strong>maintainers</strong> publish and update SBOM-linked artifacts quickly and securely.
        </li>
        <li>
          Allows <strong>users</strong> to verify artifacts instantly without relying on a central server.
        </li>
      </ul>
      <p className="muted">
        The system uses a decentralized registry so artifact and SBOM integrity can be checked anywhere, ensuring higher
        security, tamper resistance, and trust across the software supply chain.
      </p>
    </div>
  </section>
);

export default HowItWorks;

