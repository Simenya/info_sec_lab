import { useState } from "react";

const steps = [
  {
    title: "Standard Users",
    body: "Upload or drag & drop an artifact file, then click Verify. \n\n The tool hashes the file and checks the registry. The right panel instantly shows the status: Verified, Not Verified, or Revoked.",
  },
  {
  title: "Maintainers",
  body: "Use one of the three tools:\n\n(a) Publish – upload artifact + SBOM to register a new release\n(b) Revoke – mark an existing release as revoked\n(c) Artifact List – view all stored artifacts and their statuses"
 }
];

const HowItWorks = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [formStatus, setFormStatus] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (formData.name && formData.email && formData.message) {
      setFormStatus("success");
      // Simulate form submission
      setTimeout(() => {
        setFormData({ name: "", email: "", message: "" });
        setFormStatus("");
      }, 3000);
    }
  };

  return (
    <>
      <section className="card howto-card">
        <header className="card-header">
          <p className="eyebrow">Getting Started</p>
          <h2>End-to-end SBOM workflow</h2>
        </header>
        
        <div className="workflow-grid">
          <ol className="timeline">
            {steps.map((step, index) => (
              <li key={step.title}>
                <div className="timeline-marker">{index + 1}</div>
                <div className="timeline-content">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="info-card">
            <h3>Why this tool exists</h3>
            <ul className="feature-list">
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
        </div>
      </section>

      <section className="contact-section">
        <div className="contact-grid">
          <div className="contact-info">
            <header>
              <p className="eyebrow">Get in Touch</p>
              <h2>Contact Us</h2>
              <p className="subtitle">Have questions about S-SBOM validation? We're here to help.</p>
            </header>

            <div className="contact-details">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div>
                  <h4>Email</h4>
                  <p>support@s-sbom.validator</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">💬</div>
                <div>
                  <h4>Community</h4>
                  <p>Join our Discord or GitHub discussions</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">📚</div>
                <div>
                  <h4>Documentation</h4>
                  <p>Check out our comprehensive guides</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-wrapper">
            <div className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Tell us how we can help..."
                />
              </div>

              <button type="button" className="submit-btn" onClick={handleSubmit}>
                Send Message
              </button>

              {formStatus === "success" && (
                <div className="form-success">
                  ✓ Message sent successfully! We'll get back to you soon.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HowItWorks;
