import assert from "node:assert/strict";
import test from "node:test";
import { BlockchainReadClient } from "./BlockchainReadClient";
import { loadEnvironment } from "../config/env";

test("instantiates a read contract from validated configuration", () => {
  const environment = loadEnvironment({ CERTIFICATE_CONTRACT_ADDRESS: "0x0000000000000000000000000000000000000001" });
  const contract = new BlockchainReadClient(environment).getContract();
  assert.equal(contract.target, "0x0000000000000000000000000000000000000001");
});
