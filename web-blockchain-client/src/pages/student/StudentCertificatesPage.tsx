import { Card, Empty, List, QRCode, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../api/client";
import { CertificateStatusTag } from "../../components/StatusTags";
import type { Certificate, PageResult } from "../../types/api";
export function StudentCertificatesPage() { const [data, setData] = useState<PageResult<Certificate>>(); useEffect(() => { get<PageResult<Certificate>>("/student/certificates").then(setData); }, []); if (!data) return <Spin />; return <><Typography.Title level={2}>Văn bằng của tôi</Typography.Title><List grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }} dataSource={data.items} locale={{ emptyText: <Empty description="Chưa có văn bằng" /> }} renderItem={(item) => <List.Item><Link to={`/student/certificates/${item._id}`}><Card title={item.certificateName} extra={<CertificateStatusTag status={item.status} />}><Typography.Paragraph>{item.certificateCode}</Typography.Paragraph><Typography.Text type="secondary">{item.major}</Typography.Text><br /><Typography.Text type="secondary">{new Date(item.issueDate).toLocaleDateString("vi-VN")}</Typography.Text></Card></Link></List.Item>} /></>; }
