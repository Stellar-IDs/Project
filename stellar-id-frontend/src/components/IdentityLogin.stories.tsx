import type { Meta, StoryObj } from "@storybook/react";
import { IdentityLogin } from "./IdentityLogin.js";
import { SessionProvider } from "../session/SessionProvider.js";

const meta: Meta<typeof IdentityLogin> = {
  title: "Authentication/IdentityLogin",
  component: IdentityLogin,
  decorators: [
    (Story) => (
      <SessionProvider
        config={{
          createSigner: () => {
            throw new Error("stories do not connect wallets");
          },
        }}
      >
        <Story />
      </SessionProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof IdentityLogin>;

/** Default disconnected state (clicking fails loudly — no wallet in stories). */
export const Default: Story = {
  args: {},
};

/** Dark theme via the data attribute. */
export const Dark: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div data-sid-theme="dark" style={{ padding: 16, background: "#111827" }}>
        <Story />
      </div>
    ),
  ],
};
