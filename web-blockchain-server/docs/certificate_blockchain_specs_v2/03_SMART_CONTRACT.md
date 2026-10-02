# 03 — SMART CONTRACT

## Contract

Tên:
`CertificateRegistry.sol`

## Struct

```solidity
struct Certificate {
    bytes32 documentHash;
    uint256 issuedAt;
    address issuer;
    bool exists;
    bool revoked;
}
```

## Mapping

```solidity
mapping(string => Certificate) private certificates;
```

Key:
`certificateCode`

## issueCertificate

```solidity
function issueCertificate(
    string calldata certificateCode,
    bytes32 documentHash
) external onlyIssuer
```

Requirements:
- certificateCode chưa tồn tại
- documentHash khác zero
- emit `CertificateIssued`

## getCertificate

Trả:
- documentHash
- issuedAt
- issuer
- exists
- revoked

## verifyCertificate

```solidity
function verifyCertificate(
    string calldata certificateCode,
    bytes32 documentHash
) external view returns (bool)
```

True khi:
- exists
- hash match
- not revoked

## revokeCertificate

```solidity
function revokeCertificate(
    string calldata certificateCode
) external onlyIssuer
```

Requirements:
- exists
- not revoked

Emit:
`CertificateRevoked`

## Access control

Đối với KLTN có thể:
- owner = deployer
- `onlyIssuer` cho owner

Nếu dùng OpenZeppelin:
- Ownable

## Events

```solidity
event CertificateIssued(
    string certificateCode,
    bytes32 documentHash,
    address issuer,
    uint256 issuedAt
);

event CertificateRevoked(
    string certificateCode,
    address issuer,
    uint256 revokedAt
);
```

## Tests

Phải test:
- issue success
- duplicate issue revert
- get certificate
- verify correct hash
- verify wrong hash
- revoke
- verify revoked false
- unauthorized issue nếu có access control

## Output phase

Codex phải tạo:
- contract
- tests
- deploy script
- ABI/artifact path usable by backend
- env example cho contract address
