import { ethers } from "hardhat";

async function main() {
  const registry = await ethers.deployContract("CertificateRegistry");
  await registry.waitForDeployment();
  console.log(`CertificateRegistry deployed to: ${await registry.getAddress()}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
