import { ArrowLeftOutlined } from "@ant-design/icons";
import { Alert, Button, Card, DatePicker, Form, Input, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiClientError, post } from "../../api/client";
import { StudentAcademicFields } from "../../components/StudentAcademicFields";
import type { Student } from "../../types/api";

export function StudentFormPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const submit = async (values: Record<string, unknown>) => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await post<Student>("/admin/students", {
        ...values,
        dateOfBirth: values.dateOfBirth ? (values.dateOfBirth as dayjs.Dayjs).format("YYYY-MM-DD") : undefined,
      });
      navigate(`/admin/students/${data._id}`);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Không thể tạo sinh viên");
    } finally {
      setLoading(false);
    }
  };

  return <>
    <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
    <Typography.Title level={2}>Tạo sinh viên</Typography.Title>
    {error && <Alert className="mb" type="error" message={error} />}
    <Card><Form form={form} layout="vertical" onFinish={submit}>
      <Form.Item label="Mã sinh viên" name="studentCode" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Họ tên" name="fullName" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Ngày sinh" name="dateOfBirth"><DatePicker className="full" /></Form.Item>
      <StudentAcademicFields form={form} />
      <Typography.Title level={5}>Tạo tài khoản sinh viên (tùy chọn)</Typography.Title>
      <Form.Item label="Email" name="email"><Input /></Form.Item>
      <Form.Item label="Mật khẩu" name="password"><Input.Password /></Form.Item>
      <Button type="primary" htmlType="submit" loading={loading}>Lưu sinh viên</Button>
    </Form></Card>
  </>;
}
