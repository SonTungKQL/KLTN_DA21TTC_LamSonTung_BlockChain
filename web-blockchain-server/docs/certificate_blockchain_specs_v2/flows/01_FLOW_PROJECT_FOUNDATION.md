# FLOW 01 — PROJECT FOUNDATION

## Goal
Chuẩn bị project để các flow sau có thể chạy end-to-end.

## Reference
- `../01_SCOPE_AND_ARCHITECTURE.md`
- `../02_DATABASE_AND_STATE_MACHINE.md`
- `../03_SMART_CONTRACT.md`

## End-to-end scope

Frontend:
- React + Vite + TypeScript
- React Router
- API client base
- AdminLayout, StudentLayout, PublicLayout skeleton
- route guards skeleton

Backend:
- bootstrap app hiện tại
- config/env validation
- Mongo connection
- base response/error convention
- module folders

Blockchain:
- Hardhat workspace/config
- `CertificateRegistry.sol`
- deploy script
- contract test
- ABI path/backend integration config

## Done when
- frontend build pass
- backend build pass
- Mongo connects
- local blockchain starts
- contract deploys
- backend can instantiate contract read client
- no business feature UI yet beyond skeleton
