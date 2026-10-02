import {
  CheckCircleFilled,
  CloseCircleFilled,
  SafetyCertificateOutlined,
  StopFilled,
} from "@ant-design/icons";
import { Alert, Card, Descriptions, Result, Spin, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { get } from "../../api/client";
import type { Certificate } from "../../types/api";

type Verify = {
  result: "VALID" | "INVALID" | "REVOKED" | "NOT_FOUND";
  certificate?: Certificate;
};

export function VerifyPage() {
  const { certificateCode } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Verify>();
  const [error, setError] = useState(false);
  const source = searchParams.get("source");
  const method = source === "qr" ? "QR" : source === "hash" ? "HASH" : "CODE";

  useEffect(() => {
    setData(undefined);
    setError(false);
    if (certificateCode)
      get<Verify>(
        `/public/certificates/verify/${encodeURIComponent(certificateCode)}?method=${method}`,
      )
        .then(setData)
        .catch(() => setError(true));
  }, [certificateCode, method]);

  if (error)
    return <Alert type="error" message="Không thể kết nối dịch vụ xác thực" />;
  if (!data)
    return <div className="verify-loading"><Spin size="large" /><Typography.Paragraph>Đang xác thực dữ liệu...</Typography.Paragraph></div>;
  if (data.result === "NOT_FOUND")
    return <Result status="404" title="Không tìm thấy văn bằng" subTitle="Vui lòng kiểm tra lại mã văn bằng hoặc mã Blockchain." />;
  if (data.result === "INVALID")
    return <Result status="error" icon={<CloseCircleFilled />} title="Không thể xác thực văn bằng" subTitle="Dữ liệu không khớp với Blockchain." />;

  const revoked = data.result === "REVOKED";
  const certificate = data.certificate!;
  return <Card className="verify-card">
    <Result status={revoked ? "warning" : "success"} icon={revoked ? <StopFilled /> : <CheckCircleFilled />} title={revoked ? "Văn bằng đã bị thu hồi" : "Văn bằng hợp lệ"} subTitle={revoked ? certificate.revokeReason : "Dữ liệu đã được xác thực trên Blockchain"} />
    <Descriptions column={1} bordered items={[
      { key: "code", label: "Mã văn bằng", children: certificate.certificateCode },
      { key: "student", label: "Người học", children: certificate.studentId?.fullName },
      { key: "name", label: "Văn bằng", children: certificate.certificateName },
      { key: "major", label: "Ngành", children: certificate.major },
      { key: "date", label: "Ngày cấp", children: new Date(certificate.issueDate).toLocaleDateString("vi-VN") },
      { key: "institution", label: "Cơ sở đào tạo", children: certificate.institutionId?.name },
      { key: "chain", label: "Blockchain", children: <Tag color={revoked ? "orange" : "green"} icon={<SafetyCertificateOutlined />}>{revoked ? "Đã thu hồi" : "Đã xác thực"}</Tag> },
    ]} />
  </Card>;
}
