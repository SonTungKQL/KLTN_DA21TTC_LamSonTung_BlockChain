import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, List, Space, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "../../api/client";
import { CertificateStatusTag } from "../../components/StatusTags";
import type { Certificate, PageResult, Student } from "../../types/api";

export function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student>();
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([get<Student>(`/admin/students/${id}`), get<PageResult<Certificate>>(`/admin/certificates?studentId=${id}`)]).then(([studentResult, certificateResult]) => { setStudent(studentResult); setCertificates(certificateResult.items); });
  }, [id]);

  if (!student || !id) return <Spin />;
  return <>
    <Space className="page-heading">
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
      <Button icon={<EditOutlined />} onClick={() => navigate(`/admin/students/${id}/edit`)}>Chỉnh sửa sinh viên</Button>
    </Space>
    <Typography.Title level={2}>{student.fullName}</Typography.Title>
    <Card><Descriptions column={{ xs: 1, sm: 2 }} items={[
      { key: "code", label: "Mã sinh viên", children: student.studentCode },
      { key: "major", label: "Ngành", children: student.major },
      { key: "class", label: "Lớp", children: student.className ?? "—" },
      { key: "course", label: "Khóa", children: student.course ?? "—" },
    ]} /></Card>
    <Card className="section-card" title="Văn bằng"><List dataSource={certificates} locale={{ emptyText: "Chưa có văn bằng" }} renderItem={(certificate) => <List.Item actions={[<Button type="link" onClick={() => navigate(`/admin/certificates/${certificate._id}`)}>Xem / xác thực</Button>]}><List.Item.Meta title={certificate.certificateName} description={certificate.certificateCode} /><CertificateStatusTag status={certificate.status} /></List.Item>} /></Card>
  </>;
}
