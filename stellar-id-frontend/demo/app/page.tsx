import { DemoProviders } from "./providers";
import { DemoFlow } from "./demo-flow";

/**
 * Demo home: testnet banner, sign-in, profile, and the credential
 * issue/verify/revoke walkthrough. Rendered statically; `?demowallet=1` is
 * read in the browser by `DemoProviders`, so the page also works as a
 * static export (GitHub Pages).
 */
export default function HomePage() {
  return (
    <DemoProviders>
      <main>
        <h1>Stellar Identity Demo</h1>
        <p className="banner" role="note">
          Testnet only — this demo creates real testnet entries. Never use real funds here.
        </p>
        <DemoFlow />
      </main>
    </DemoProviders>
  );
}
