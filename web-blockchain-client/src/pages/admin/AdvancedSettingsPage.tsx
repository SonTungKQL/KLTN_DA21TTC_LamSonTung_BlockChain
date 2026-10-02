import { DatabaseOutlined, InfoCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Form, InputNumber, Row, Statistic, Typography, message } from "antd";
import { useState } from "react";
import { ApiClientError, post } from "../../api/client";

type FakeDataResult = {
  batchId: string;
  requested: number;
  created: Record<string, number>;
};

const labels: Record<string, string> = {
  users: "Tài khoản sinh viên",
  institutions: "Cơ sở đào tạo",
  majors: "Ngành đào tạo",
  courses: "Khóa học",
  classes: "Lớp học",
  students: "Sinh viên",
  certificates: "Văn bằng",
  certificateSequences: "Sequence mã văn bằng",
  blockchainTransactions: "Giao dịch Blockchain",
  verificationLogs: "Nhật ký xác thực",
  consultations: "Yêu cầu tư vấn",
};

export function AdvancedSettingsPage() {
  const [form] = Form.useForm<{ quantity: number }>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FakeDataResult>();
  const [error, setError] = useState<string>();

  const generate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(undefined);
      const generated = await post<FakeDataResult>("/admin/settings/fake-data", values);
      setResult(generated);
      message.success(`Đã tạo xong dữ liệu mẫu cho ${generated.requested} nhóm.`);
    } catch (reason) {
      if (reason instanceof ApiClientError) setError(reason.message);
    } finally {
      setLoading(false);
    }
  };

  return <>
    <Typography.Title level={2}>Cài đặt nâng cao</Typography.Title>
    <Typography.Paragraph type="secondary">Tạo dữ liệu mẫu phục vụ kiểm thử và trình diễn. Mỗi đơn vị nhập vào tạo một chuỗi dữ liệu liên kết đầy đủ.</Typography.Paragraph>
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={14}>
        <Card title={<><DatabaseOutlined /> Tạo dữ liệu giả</>}>
          <Alert showIcon type="info" icon={<InfoCircleOutlined />} message="Không gửi giao dịch lên Blockchain thật" description="Hệ thống tạo dữ liệu minh họa có đủ khóa liên kết và trạng thái giao dịch mô phỏng. Không sử dụng cho dữ liệu vận hành chính thức." />
          <Form form={form} layout="vertical" initialValues={{ quantity: 10 }} style={{ marginTop: 24 }}>
            <Form.Item label="Số lượng mỗi nhóm dữ liệu" name="quantity" rules={[{ required: true, message: "Hãy nhập số lượng" }]} extra="Từ 1 đến 200. Ví dụ nhập 10 sẽ tạo 10 bản ghi cho mỗi collection liên quan.">
              <InputNumber min={1} max={200} precision={0} style={{ width: "100%" }} />
            </Form.Item>
            <Button type="primary" icon={<PlayCircleOutlined />} loading={loading} onClick={() => void generate()}>Tạo dữ liệu mẫu</Button>
          </Form>
          {error && <Alert style={{ marginTop: 20 }} type="error" showIcon message="Không thể tạo dữ liệu" description={error} />}
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card title="Chuỗi dữ liệu được tạo">
          <Typography.Paragraph type="secondary">Cơ sở đào tạo → ngành, khóa, lớp → tài khoản và sinh viên → văn bằng → giao dịch, xác thực, tư vấn.</Typography.Paragraph>
          {result ? <>
            <Alert type="success" showIcon message={`Hoàn tất batch ${result.batchId}`} description={`Đã tạo ${result.requested} nhóm dữ liệu liên kết.`} />
            <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
              {Object.entries(result.created).map(([key, count]) => <Col span={12} key={key}><Statistic title={labels[key] ?? key} value={count} valueStyle={{ fontSize: 20 }} /></Col>)}
            </Row>
          </> : <Typography.Paragraph type="secondary">Kết quả tạo dữ liệu sẽ xuất hiện tại đây.</Typography.Paragraph>}
        </Card>
      </Col>
    </Row>
  </>;
}
