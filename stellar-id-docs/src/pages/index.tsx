import Link from "@docusaurus/Link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "48rem", margin: "auto" }}>
      <h1>Stellar Identity &amp; Authentication Suite</h1>
      <p>
        Decentralized identity for Stellar: a <code>did:stellar</code> DID method on Soroban, a
        TypeScript SDK, React components, and documentation.
      </p>
      <p>
        <strong>Status:</strong> testnet only, v0.x, unaudited. <code>stellar-id-client</code> is on
        npm; <code>stellar-id-frontend</code> is not published yet.
      </p>
      <p>
        <Link to="docs/intro">Read the docs</Link> ·{" "}
        <a href="https://stellar-ids.github.io/frontend/">Try the testnet demo</a>
      </p>
    </main>
  );
}
