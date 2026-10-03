import {
  ArrowLeftOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiClientError, get, post } from "../../api/client";
import {
  BlockchainStatusTag,
  CertificateStatusTag,
} from "../../components/StatusTags";
import { CertificateVerificationQr } from "../../components/CertificateVerificationQr";
import type { Certificate } from "../../types/api";
export function CertificateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Certificate>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [reason, setReason] = useState("");
  const load = () =>
    id &&
    get<Certificate>(`/admin/certificates/${id}`)
      .then(setData)
      .catch(() => setError("Không thể tải văn bằng"));
  useEffect(() => {
    load();
  }, [id]);
  const action = async (type: "retry" | "revoke") => {
    if (!id) return;
    console.log("cc ");
    setBusy(true);
    try {
      const result = await post<Certificate>(
        type === "retry"
          ? `/admin/certificates/${id}/retry-blockchain`
          : `/admin/certificates/${id}/revoke`,
        type === "revoke" ? { reason } : undefined,
      );
      setData(result);
      setRevokeOpen(false);
      message.success(
        type === "retry" ? "Đã xử lý retry" : "Đã thu hồi văn bằng",
      );
    } catch (e) {
      console.log("oke ");
      setError(
        e instanceof ApiClientError ? e.message : "Không thể xử lý yêu cầu",
      );
    } finally {
      setBusy(false);
    }
  };
  if (!data) return <Spin />;
  const hasQr = data.status === "ISSUED" || data.status === "REVOKED";
  return (
    <>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
      >
        Quay lại
      </Button>
      <Space className="page-heading">
        <Typography.Title level={2}>{data.certificateCode}</Typography.Title>
        <CertificateStatusTag status={data.status} />
      </Space>
      {error && <Alert className="mb" type="error" message={error} />}
      {data.status === "REVOKED" && (
        <Alert
          className="mb"
          type="warning"
          showIcon
          message="Văn bằng đã bị thu hồi / hủy hiệu lực"
          description={
            <>
              <div>{data.revokeReason ?? "Không có lý do được ghi nhận."}</div>
              {data.revokedAt && (
                <div>
                  Thời điểm thu hồi:{" "}
                  {new Date(data.revokedAt).toLocaleString("vi-VN")}
                </div>
              )}
            </>
          }
        />
      )}
      <Card title="Thông tin văn bằng">
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          items={[
            {
              key: "name",
              label: "Tên văn bằng",
              children: data.certificateName,
            },
            {
              key: "student",
              label: "Sinh viên",
              children: data.studentId?.fullName,
            },
            { key: "major", label: "Ngành", children: data.major },
            {
              key: "date",
              label: "Ngày cấp",
              children: new Date(data.issueDate).toLocaleDateString("vi-VN"),
            },
            {
              key: "class",
              label: "Xếp loại",
              children: data.classification ?? "—",
            },
            {
              key: "institution",
              label: "Cơ sở",
              children: data.institutionId?.name,
            },
          ]}
        />
      </Card>
      <Card className="section-card" title="Blockchain">
        <Descriptions
          column={1}
          items={[
            {
              key: "hash",
              label: "Document hash",
              children: (
                <Typography.Text copyable>{data.documentHash}</Typography.Text>
              ),
            },
            {
              key: "tx",
              label: "Giao dịch phát hành",
              children: data.transactionHash ? (
                <Typography.Text copyable>
                  {data.transactionHash}
                </Typography.Text>
              ) : (
                "Chưa có"
              ),
            },
            { key: "block", label: "Block", children: data.blockNumber ?? "—" },
            {
              key: "revokeTx",
              label: "Giao dịch thu hồi",
              children: data.revocationTransactionHash ? (
                <Typography.Text copyable>
                  {data.revocationTransactionHash}
                </Typography.Text>
              ) : (
                "—"
              ),
            },
            {
              key: "revokeBlock",
              label: "Block thu hồi",
              children: data.revocationBlockNumber ?? "—",
            },
            {
              key: "status",
              label: "Trạng thái",
              children: <BlockchainStatusTag status={data.blockchainStatus} />,
            },
            {
              key: "error",
              label: "Lỗi",
              children: data.blockchainError ?? "—",
            },
          ]}
        />
      </Card>
      {hasQr && id && (
        <CertificateVerificationQr
          endpoint={`/admin/certificates/${id}/verification-qr`}
          revoked={data.status === "REVOKED"}
        />
      )}
      <Space className="section-card">
        {data.status === "BLOCKCHAIN_FAILED" && (
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={busy}
            onClick={() => action("retry")}
          >
            Retry Blockchain
          </Button>
        )}
        {data.status === "ISSUED" && (
          <Button
            danger
            icon={<StopOutlined />}
            onClick={() => setRevokeOpen(true)}
          >
            Thu hồi / hủy hiệu lực
          </Button>
        )}
      </Space>
      <Modal
        title="Thu hồi / hủy hiệu lực văn bằng"
        open={revokeOpen}
        confirmLoading={busy}
        destroyOnHidden
        afterClose={() => setReason("")}
        onCancel={() => setRevokeOpen(false)}
        onOk={() => action("revoke")}
        okButtonProps={{ disabled: !reason.trim(), danger: true }}
      >
        <Alert
          className="mb"
          type="warning"
          showIcon
          message="Thao tác này không xóa dữ liệu nhưng sẽ làm văn bằng không còn hợp lệ khi xác minh."
        />
        <Typography.Paragraph>
          Nhập lý do thu hồi / hủy hiệu lực:
        </Typography.Paragraph>
        <Input.TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={1000}
          showCount
        />
      </Modal>
    </>
  );
}
