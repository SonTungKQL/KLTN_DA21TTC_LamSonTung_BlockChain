import { ArrowLeftOutlined } from "@ant-design/icons";
import { Alert, Button, Card, DatePicker, Form, Input, Spin, Typography, message } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiClientError, get, patch } from "../../api/client";
import { StudentAcademicFields } from "../../components/StudentAcademicFields";
import type { Student } from "../../types/api";

interface StudentFormValues { studentCode: string; fullName: string; dateOfBirth?: Dayjs; institutionId?: string; majorId?: string; courseId?: string; classId?: string; }

export function StudentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm<StudentFormValues>();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!id) return;
    get<Student>(`/admin/students/${id}`).then((student) => {
      form.setFieldsValue({ ...student, dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth) : undefined });
      setReady(true);
    }).catch(() => setError("Không thể tải thông tin sinh viên"));
  }, [form, id]);

  const submit = async (values: StudentFormValues) => {
    if (!id) return;
    setLoading(true);
    setError(undefined);
    try {
      await patch<Student>(`/admin/students/${id}`, { ...values, dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD") });
      message.success("Đã cập nhật thông tin sinh viên");
      navigate(`/admin/students/${id}`);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Không thể cập nhật sinh viên");
    } finally {
      setLoading(false);
    }
  };

  if (!id) return null;
  return <>
    <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
    <Typography.Title level={2}>Chỉnh sửa sinh viên</Typography.Title>
    {error && <Alert className="mb" type="error" showIcon message={error} />}
    <Card>{!ready && !error ? <Spin /> : <Form form={form} layout="vertical" onFinish={submit}>
      <Form.Item label="Mã sinh viên" name="studentCode" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Họ tên" name="fullName" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Ngày sinh" name="dateOfBirth"><DatePicker className="full" /></Form.Item>
      <StudentAcademicFields form={form} />
      <Button type="primary" htmlType="submit" loading={loading}>Lưu thay đổi</Button>
    </Form>}</Card>
  </>;
}
