import { ArrowLeftOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Typography,
  message,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiClientError, get, post } from "../../api/client";
import type {
  Certificate,
  Institution,
  PageResult,
  Student,
} from "../../types/api";

interface IssueFormValues {
  studentId: string;
  institutionId: string;
  certificateName: string;
  degreeType?: string;
  major: string;
  classification?: string;
  issueDate: Dayjs;
  documentUrl?: string;
}

export function CertificateFormPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<IssueFormValues>();
  const studentId = Form.useWatch("studentId", form);
  const institutionId = Form.useWatch("institutionId", form);
  const issueDate = Form.useWatch("issueDate", form);
  const [students, setStudents] = useState<Student[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [draft, setDraft] = useState<IssueFormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const selectedStudent = students.find((student) => student._id === studentId);
  const selectedInstitution = institutions.find((institution) => institution._id === institutionId);
  const certificateCodePreview = selectedInstitution && issueDate ? `${selectedInstitution.code}-${issueDate.format("YYYY")}-000001` : "Sẽ tự động tạo sau khi chọn cơ sở và ngày cấp";

  useEffect(() => {
    Promise.all([
      get<PageResult<Student>>("/admin/students?limit=100"),
      get<Institution[]>("/admin/institutions"),
    ])
      .then(([studentResult, institutionResult]) => {
        setStudents(studentResult.items);
        setInstitutions(institutionResult);
      })
      .catch(() => setError("Không thể tải dữ liệu biểu mẫu"));
  }, []);

  const issue = async () => {
    if (!draft) return;
    setLoading(true);
    setError(undefined);
    try {
      const certificate = await post<Certificate>("/admin/certificates", {
        ...draft,
        issueDate: draft.issueDate.format("YYYY-MM-DD"),
      });
      message[certificate.status === "ISSUED" ? "success" : "warning"](
        certificate.status === "ISSUED"
          ? "Đã cấp văn bằng và xác nhận trên Blockchain"
          : "Văn bằng đã được lưu nhưng ghi Blockchain thất bại. Có thể thử lại ở trang chi tiết.",
      );
      setDraft(undefined);
      navigate(`/admin/certificates/${certificate._id}`);
    } catch (reason) {
      const text = reason instanceof ApiClientError ? reason.message : "Không thể cấp văn bằng";
      setError(text);
      message.error(text);
    } finally {
      setLoading(false);
    }
  };

  if (!students.length && !institutions.length && !error) return <Spin />;

  return <>
    <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
    <Typography.Title level={2}>Cấp văn bằng điện tử</Typography.Title>
    <Typography.Paragraph type="secondary">
      Thông tin được băm, ghi nhận qua Smart Contract và chỉ hợp lệ khi giao dịch Blockchain được xác nhận.
    </Typography.Paragraph>
    {error && <Alert className="mb" type="error" showIcon message={error} />}
    <Card>
      <Form form={form} layout="vertical" onFinish={setDraft} requiredMark="optional">
        <Form.Item name="studentId" label="Sinh viên" rules={[{ required: true, message: "Chọn sinh viên nhận văn bằng" }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn sinh viên"
            options={students.map((student) => ({ value: student._id, label: `${student.studentCode} — ${student.fullName}` }))}
            onChange={(value) => {
              const student = students.find((item) => item._id === value);
              if (student && !form.getFieldValue("major")) form.setFieldValue("major", student.major);
            }}
          />
        </Form.Item>
        {selectedStudent && <Alert className="mb" type="info" showIcon message={`${selectedStudent.fullName} — ${selectedStudent.studentCode}`} description={`Ngành hồ sơ: ${selectedStudent.major}`} />}
        <Form.Item name="institutionId" label="Cơ sở đào tạo" rules={[{ required: true, message: "Chọn cơ sở đào tạo" }]}>
          <Select placeholder="Chọn cơ sở đào tạo" options={institutions.map((institution) => ({ value: institution._id, label: `${institution.code} — ${institution.name}` }))} />
        </Form.Item>
        <Form.Item label="Mã văn bằng (tự động tạo)"><Input disabled value={certificateCodePreview} /></Form.Item>
        <Form.Item name="certificateName" label="Tên văn bằng" rules={[{ required: true, message: "Nhập tên văn bằng" }, { max: 300 }]}>
          <Input placeholder="VD: Kỹ sư Công nghệ thông tin" />
        </Form.Item>
        <Form.Item name="degreeType" label="Loại bằng">
          <Select
            allowClear
            placeholder="Chọn loại bằng"
            options={[
              { value: "Cử nhân", label: "Cử nhân" },
              { value: "Kỹ sư", label: "Kỹ sư" },
              { value: "Thạc sĩ", label: "Thạc sĩ" },
              { value: "Tiến sĩ", label: "Tiến sĩ" },
              { value: "Chứng chỉ", label: "Chứng chỉ" },
              { value: "Chứng nhận", label: "Chứng nhận" },
            ]}
          />
        </Form.Item>
        <Form.Item name="major" label="Ngành" rules={[{ required: true, message: "Nhập ngành đào tạo" }, { max: 200 }]}><Input /></Form.Item>
        <Form.Item name="classification" label="Xếp loại">
          <Select
            allowClear
            placeholder="Chọn xếp loại"
            options={[
              { value: "Xuất sắc", label: "Xuất sắc" },
              { value: "Giỏi", label: "Giỏi" },
              { value: "Khá", label: "Khá" },
              { value: "Trung bình khá", label: "Trung bình khá" },
              { value: "Trung bình", label: "Trung bình" },
              { value: "Đạt", label: "Đạt" },
            ]}
          />
        </Form.Item>
        <Form.Item name="issueDate" label="Ngày cấp" rules={[{ required: true, message: "Chọn ngày cấp" }]}><DatePicker className="full" disabledDate={(date) => date.isAfter(dayjs(), "day")} /></Form.Item>
        <Form.Item name="documentUrl" label="URL tài liệu" rules={[{ type: "url", message: "URL tài liệu không hợp lệ" }]}><Input placeholder="https://... (không bắt buộc)" /></Form.Item>
        <Button type="primary" htmlType="submit" icon={<SafetyCertificateOutlined />} disabled={loading}>Xem lại và cấp trên Blockchain</Button>
      </Form>
    </Card>
    <Modal title="Xác nhận cấp văn bằng điện tử" open={Boolean(draft)} okText="Cấp văn bằng" cancelText="Quay lại chỉnh sửa" confirmLoading={loading} onCancel={() => !loading && setDraft(undefined)} onOk={issue} okButtonProps={{ icon: <SafetyCertificateOutlined /> }}>
      <Alert className="mb" type="info" showIcon message="Sau khi xác nhận, hệ thống sẽ tạo hash dữ liệu và gửi giao dịch đến Smart Contract." />
      {draft && <Descriptions column={1} size="small" items={[
        { key: "student", label: "Sinh viên", children: students.find((student) => student._id === draft.studentId)?.fullName },
        { key: "institution", label: "Cơ sở đào tạo", children: institutions.find((institution) => institution._id === draft.institutionId)?.name },
        { key: "code", label: "Mã văn bằng", children: `${institutions.find((institution) => institution._id === draft.institutionId)?.code ?? "…"}-${draft.issueDate.format("YYYY")}-000001 (số thứ tự thực tế do hệ thống cấp)` },
        { key: "name", label: "Văn bằng", children: draft.certificateName },
        { key: "major", label: "Ngành", children: draft.major },
        { key: "date", label: "Ngày cấp", children: draft.issueDate.format("DD/MM/YYYY") },
      ]} />}
    </Modal>
  </>;
}
