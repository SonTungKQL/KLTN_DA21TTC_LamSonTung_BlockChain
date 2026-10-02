import { Contract, JsonRpcProvider } from "ethers";
import type { AppEnvironment } from "../config/env";
import certificateRegistryAbi from "./certificate-registry.abi.json";

export class BlockchainReadClient {
  private readonly provider: JsonRpcProvider;

  constructor(private readonly environment: AppEnvironment) {
    this.provider = new JsonRpcProvider(environment.BLOCKCHAIN_RPC_URL, environment.BLOCKCHAIN_CHAIN_ID);
  }

  getContract(): Contract {
    if (!this.environment.CERTIFICATE_CONTRACT_ADDRESS) {
      throw new Error("CERTIFICATE_CONTRACT_ADDRESS is required after deploying CertificateRegistry");
    }
    return new Contract(this.environment.CERTIFICATE_CONTRACT_ADDRESS, certificateRegistryAbi, this.provider);
  }
}
