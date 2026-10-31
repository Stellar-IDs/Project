import { describe, expect, it } from "vitest";
import { Err, Ok } from "@stellar/stellar-sdk/contract";
import { contractErrorName, mapCallError, unwrapResult } from "../src/gateway.js";
import {
  DidDeactivatedError,
  DidNotFoundError,
  NetworkError,
  SimulationError,
} from "../src/errors.js";

const DID = "did:stellar:testnet:GTEST";

describe("contractErrorName", () => {
  it("reads names from Error instances and plain { message } objects", () => {
    expect(contractErrorName(new Error("HostError: NotFound"))).toBe("NotFound");
    expect(contractErrorName({ message: "LimitExceeded" })).toBe("LimitExceeded");
  });

  it("maps host error codes from failed simulations", () => {
    expect(contractErrorName(new Error('HostError: Error(Contract, #2)\n\nEvent log'))).toBe(
      "AlreadyExists",
    );
    expect(contractErrorName(new Error("HostError: Error(Contract, #9)"))).toBe("LimitExceeded");
    expect(contractErrorName(new Error("HostError: Error(Contract, #99)"))).toBeUndefined();
  });

  it("returns undefined for unrelated failures", () => {
    expect(contractErrorName(new Error("boom"))).toBeUndefined();
    expect(contractErrorName(null)).toBeUndefined();
  });
});

describe("unwrapResult", () => {
  it("returns Ok values and passes plain values through", () => {
    expect(unwrapResult(new Ok(42), DID)).toBe(42);
    expect(unwrapResult("plain", DID)).toBe("plain");
  });

  // Regression: the generated bindings' `Err` carries `{ message: "NotFound" }`,
  // which was previously mapped to an unnamed SimulationError.
  it("maps contract Err results to typed errors", () => {
    expect(() => unwrapResult(new Err({ message: "NotFound" }), DID)).toThrow(DidNotFoundError);
    expect(() => unwrapResult(new Err({ message: "Deactivated" }), DID)).toThrow(
      DidDeactivatedError,
    );
    expect(() => unwrapResult(new Err({ message: "LimitExceeded" }), DID)).toThrow(
      /contract rejected the call: LimitExceeded/,
    );
  });
});

describe("mapCallError", () => {
  it("rethrows typed DID errors unchanged", () => {
    const err = new DidNotFoundError(DID);
    expect(() => mapCallError(err, DID)).toThrow(err);
  });

  it("maps transport and unknown failures", () => {
    expect(() => mapCallError(new TypeError("fetch failed"), DID)).toThrow(NetworkError);
    expect(() => mapCallError(new Error("weird"), DID)).toThrow(SimulationError);
  });
});
