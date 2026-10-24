import { DemoProviders } from "./providers";
import { DemoFlow } from "./demo-flow";

/**
 * Demo home: testnet banner, sign-in, profile, and the credential
 * issue/verify/revoke walkthrough.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ demowallet?: string }>;
}) {
  const params = (await searchParams) ?? {};
  return (
    <DemoProviders autoWallet={params["demowallet"] === "1"}>
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
