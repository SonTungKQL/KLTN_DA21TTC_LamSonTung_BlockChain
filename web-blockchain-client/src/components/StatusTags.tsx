import { Tag } from "antd";
import type { BlockchainStatus, CertificateStatus } from "../types/api";
const certificate: Record<CertificateStatus, [string, string]> = {
  PENDING: ["processing", "Đang xử lý"],
  ISSUED: ["success", "Đã cấp"],
  BLOCKCHAIN_FAILED: ["error", "Blockchain lỗi"],
  REVOKED: ["default", "Đã thu hồi"],
};
const blockchain: Record<BlockchainStatus, [string, string]> = {
  NOT_SUBMITTED: ["default", "Chưa gửi"],
  SUBMITTED: ["processing", "Đã gửi"],
  CONFIRMED: ["success", "Đã xác nhận"],
  FAILED: ["error", "Thất bại"],
};
export function CertificateStatusTag({
  status,
}: {
  status: CertificateStatus;
}) {
  const [color, text] = certificate[status];
  return <Tag color={color}>{text}</Tag>;
}
export function BlockchainStatusTag({ status }: { status: BlockchainStatus }) {
  const [color, text] = blockchain[status];
  return <Tag color={color}>{text}</Tag>;
}
