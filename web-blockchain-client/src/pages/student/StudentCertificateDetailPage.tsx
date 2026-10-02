import { ArrowLeftOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "../../api/client";
import { CertificateVerificationQr } from "../../components/CertificateVerificationQr";
import { CertificateStatusTag } from "../../components/StatusTags";
import type { Certificate } from "../../types/api";

export function StudentCertificateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Certificate>();

  useEffect(() => {
    if (id) get<Certificate>(`/student/certificates/${id}`).then(setData);
  }, [id]);

  if (!data || !id) return <Spin />;
  const hasQr = data.status === "ISSUED" || data.status === "REVOKED";

  return <>
    <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
    <Typography.Title level={2}>{data.certificateName}</Typography.Title>
    <Card>
      <Descriptions column={1} items={[
        { key: "code", label: "Mã văn bằng", children: data.certificateCode },
        { key: "major", label: "Ngành", children: data.major },
        { key: "date", label: "Ngày cấp", children: new Date(data.issueDate).toLocaleDateString("vi-VN") },
        { key: "status", label: "Trạng thái", children: <CertificateStatusTag status={data.status} /> },
      ]} />
    </Card>
    {data.status === "REVOKED" && <Alert className="section-card" type="warning" showIcon message="Văn bằng đã bị thu hồi / hủy hiệu lực" description={<><div>{data.revokeReason ?? "Không có lý do được ghi nhận."}</div>{data.revokedAt && <div>Thời điểm thu hồi: {new Date(data.revokedAt).toLocaleString("vi-VN")}</div>}</>} />}
    {hasQr && <CertificateVerificationQr endpoint={`/student/certificates/${id}/verification-qr`} revoked={data.status === "REVOKED"} />}
  </>;
}
