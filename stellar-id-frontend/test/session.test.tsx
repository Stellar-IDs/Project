import { act, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  SessionProvider,
  useIdentity,
  useIdentityStatus,
  useSession,
  useSessionActions,
} from "../src/index.js";
import type { SessionConfig } from "../src/index.js";
import { fakeSigner } from "./helpers.js";

vi.mock("stellar-id-client", async (importOriginal) => {
  const mod = await importOriginal<typeof import("stellar-id-client")>();
  return {
    ...mod,
    verifyChallengeResponse: vi.fn(async () => ({
      did: "did:stellar:testnet:GTESTADDRESS",
      address: "GTESTADDRESS",
    })),
  };
});

function wrapper(config: SessionConfig) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SessionProvider config={config}>{children}</SessionProvider>;
  };
}

const connected = () => ({ createSigner: () => fakeSigner() });

describe("SessionProvider", () => {
  it("connects a wallet", async () => {
    const { result } = renderHook(
      () => ({ actions: useSessionActions(), session: useSession() }),
      { wrapper: wrapper(connected()) },
    );
    expect(result.current.session.status).toBe("disconnected");
    await act(async () => {
      await result.current.actions.connect();
    });
    expect(result.current.session.status).toBe("connected");
    expect(result.current.session.address).toBe("GTESTADDRESS");
  });

  it("authenticates through signIn and exposes identity selectors", async () => {
    function Harness() {
      const actions = useSessionActions();
      const session = useSession();
      const identity = useIdentity();
      const flags = useIdentityStatus();
      return (
        <div>
          <button type="button" onClick={() => void actions.signIn()}>
            go
          </button>
          <output data-testid="state">
            {`${session.status}|${identity.did ?? "-"}|${String(flags.isAuthenticated)}`}
          </output>
        </div>
      );
    }
    render(
      <SessionProvider config={connected()}>
        <Harness />
      </SessionProvider>,
    );
    const { getByRole, getByTestId } = screen;
    await act(async () => {
      getByRole("button", { name: "go" }).click();
    });
    expect(getByTestId("state").textContent).toBe(
      "authenticated|did:stellar:testnet:GTESTADDRESS|true",
    );
  });

  it("surfaces connection failures as errors", async () => {
    const { result } = renderHook(
      () => ({ actions: useSessionActions(), session: useSession() }),
      {
        wrapper: wrapper({
          createSigner: () => {
            throw new Error("no wallet");
          },
        }),
      },
    );
    await act(async () => {
      await result.current.actions.connect();
    });
    expect(result.current.session.status).toBe("error");
    expect(result.current.session.error?.message).toMatch(/connect/i);
  });

  it("disconnect resets the session", async () => {
    function Harness() {
      const actions = useSessionActions();
      const session = useSession();
      return (
        <div>
          <button type="button" onClick={() => void actions.signIn()}>
            go
          </button>
          <button type="button" onClick={() => actions.disconnect()}>
            bye
          </button>
          <output data-testid="state">{`${session.status}|${session.did ?? "-"}`}</output>
        </div>
      );
    }
    render(
      <SessionProvider config={connected()}>
        <Harness />
      </SessionProvider>,
    );
    await act(async () => {
      screen.getByRole("button", { name: "go" }).click();
    });
    expect(screen.getByTestId("state").textContent).toContain("authenticated");
    act(() => {
      screen.getByRole("button", { name: "bye" }).click();
    });
    expect(screen.getByTestId("state").textContent).toBe("disconnected|-");
  });

  it("throws outside a provider", () => {
    function Nope() {
      useSession();
      return null;
    }
    expect(() => render(<Nope />)).toThrow("SessionProvider");
  });
});
