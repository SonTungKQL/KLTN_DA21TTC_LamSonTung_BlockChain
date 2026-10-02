import assert from "node:assert/strict";
import test from "node:test";
import { loadEnvironment } from "./env";

test("loads safe local defaults", () => {
  const environment = loadEnvironment({});
  assert.equal(environment.PORT, 5001);
  assert.equal(environment.BLOCKCHAIN_CHAIN_ID, 31337);
  assert.equal(environment.MONGO_DB_NAME, "certificate-blockchain");
});

test("rejects an invalid contract address", () => {
  assert.throws(() => loadEnvironment({ CERTIFICATE_CONTRACT_ADDRESS: "not-an-address" }));
});

test("accepts blank optional blockchain settings", () => {
  const environment = loadEnvironment({ CERTIFICATE_CONTRACT_ADDRESS: "", BLOCKCHAIN_PRIVATE_KEY: "" });
  assert.equal(environment.CERTIFICATE_CONTRACT_ADDRESS, undefined);
  assert.equal(environment.BLOCKCHAIN_PRIVATE_KEY, undefined);
});

test("uses encryption only when the flag is literally true", () => {
  assert.equal(loadEnvironment({ API_ENCRYPTION_ENABLED: "false" }).API_ENCRYPTION_ENABLED, false);
  assert.throws(() => loadEnvironment({ API_ENCRYPTION_ENABLED: "true" }));
});
