import { CopyOutlined, QrcodeOutlined } from "@ant-design/icons";
import { Alert, Button, Card, QRCode, Space, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { ApiClientError, get } from "../api/client";
import type { CertificateVerificationQr } from "../types/api";

interface CertificateVerificationQrProps {
  endpoint: string;
  revoked?: boolean;
}

export function CertificateVerificationQr({ endpoint, revoked = false }: CertificateVerificationQrProps) {
  const [data, setData] = useState<CertificateVerificationQr>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    setData(undefined);
    setError(undefined);
    get<CertificateVerificationQr>(endpoint)
      .then(setData)
      .catch((reason) =>
        setError(reason instanceof ApiClientError ? reason.message : "Không thể tạo mã QR xác thực"),
      );
  }, [endpoint]);

  return (
    <Card className="section-card" title={<><QrcodeOutlined /> Mã QR xác thực</>}>
      {error && <Alert type="error" showIcon message={error} />}
      {!data && !error && <Spin />}
      {data && (
        <Space wrap size="large">
          <QRCode value={data.verificationUrl} errorLevel="M" />
          <div>
            <Typography.Paragraph>
              Quét mã để mở trang xác minh trực tuyến{revoked ? ". Trang sẽ hiển thị trạng thái đã thu hồi." : "."}
            </Typography.Paragraph>
            <Typography.Paragraph copyable={{ icon: <CopyOutlined /> }}>
              {data.verificationUrl}
            </Typography.Paragraph>
            <Button onClick={() => window.open(data.verificationUrl, "_blank", "noopener,noreferrer")}>
              Mở trang xác thực
            </Button>
          </div>
        </Space>
      )}
    </Card>
  );
}
