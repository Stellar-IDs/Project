import Link from "@docusaurus/Link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "48rem", margin: "auto" }}>
      <h1>Stellar Identity &amp; Authentication Suite</h1>
      <p>
        Decentralized identity for Stellar: a <code>did:stellar</code> DID
        method on Soroban, a TypeScript SDK, React components, and
        documentation.
      </p>
      <p>
        <strong>Status:</strong> testnet only, v0.x, unaudited. Packages are
        not on npm yet.
      </p>
      <Link to="docs/intro">Read the docs</Link>
    </main>
  );
}
