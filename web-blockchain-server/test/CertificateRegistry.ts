import { expect } from "chai";
import { ethers } from "hardhat";

describe("CertificateRegistry", function () {
  const certificateCode = "TVU-2026-000001";
  const documentHash = ethers.keccak256(ethers.toUtf8Bytes("canonical-certificate"));

  it("issues and verifies a certificate", async function () {
    const registry = await ethers.deployContract("CertificateRegistry");
    await registry.issueCertificate(certificateCode, documentHash);
    const certificate = await registry.getCertificate(certificateCode);
    expect(certificate.documentHash).to.equal(documentHash);
    expect(certificate.exists).to.equal(true);
    expect(await registry.verifyCertificate(certificateCode, documentHash)).to.equal(true);
  });

  it("rejects duplicate issuance and a wrong hash", async function () {
    const registry = await ethers.deployContract("CertificateRegistry");
    await registry.issueCertificate(certificateCode, documentHash);
    await expect(registry.issueCertificate(certificateCode, documentHash)).to.be.revertedWithCustomError(registry, "CertificateAlreadyExists");
    expect(await registry.verifyCertificate(certificateCode, ethers.ZeroHash)).to.equal(false);
  });

  it("restricts issue and marks a revoked certificate invalid", async function () {
    const [owner, outsider] = await ethers.getSigners();
    const registry = await ethers.deployContract("CertificateRegistry");
    await expect(registry.connect(outsider).issueCertificate(certificateCode, documentHash)).to.be.revertedWithCustomError(registry, "Unauthorized");
    await registry.connect(owner).issueCertificate(certificateCode, documentHash);
    await registry.connect(owner).revokeCertificate(certificateCode);
    expect(await registry.verifyCertificate(certificateCode, documentHash)).to.equal(false);
    expect((await registry.getCertificate(certificateCode)).revoked).to.equal(true);
  });

  it("allows the owner to authorize a second school issuer", async function () {
    const [, schoolIssuer] = await ethers.getSigners();
    const registry = await ethers.deployContract("CertificateRegistry");
    await registry.setIssuerAuthorization(schoolIssuer.address, true);
    await registry.connect(schoolIssuer).issueCertificate(certificateCode, documentHash);
    expect((await registry.getCertificate(certificateCode)).issuer).to.equal(schoolIssuer.address);
  });
});
