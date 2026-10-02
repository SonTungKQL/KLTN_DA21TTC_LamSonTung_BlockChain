import { BankOutlined, DatabaseOutlined, FileDoneOutlined, SafetyCertificateOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Card, Col, Empty, Row, Spin, Statistic, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { get } from "../../api/client";
import type { StatisticCount, StatisticsOverview, Transaction } from "../../types/api";

const certificateLabels: Record<string, string> = { ISSUED: "Đã cấp", PENDING: "Đang xử lý", BLOCKCHAIN_FAILED: "Blockchain lỗi", REVOKED: "Đã thu hồi" };
const chainLabels: Record<string, string> = { CONFIRMED: "Đã xác nhận", SUBMITTED: "Đã gửi", NOT_SUBMITTED: "Chưa gửi", FAILED: "Thất bại" };
const consultationLabels: Record<string, string> = { NEW: "Mới", CONTACTED: "Đang tư vấn", CLOSED: "Đã đóng" };
const transactionLabels: Record<string, string> = { CREATED: "Đã tạo", SUBMITTED: "Đã gửi", CONFIRMED: "Đã xác nhận", FAILED: "Thất bại" };
const colors = ["#2859d9", "#0ca7bb", "#7a52cf", "#f39b2f", "#df4c5c", "#36a269"];

function countOf(items: StatisticCount[], key: string) { return items.find((item) => item.key === key)?.count ?? 0; }
function StatusBars({ title, data, labels }: { title: string; data: StatisticCount[]; labels: Record<string, string> }) {
  const maximum = Math.max(1, ...data.map((item) => item.count));
  return <Card title={title} className="analytics-card"><div className="status-bars">{data.length ? data.map((item, index) => <div className="status-bar" key={item.key}><div><span>{labels[item.key] ?? item.key}</span><b>{item.count}</b></div><i><em style={{ width: `${(item.count / maximum) * 100}%`, background: colors[index % colors.length] }} /></i></div>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />}</div></Card>;
}
function TrendChart({ data }: { data: StatisticsOverview["issueTrend"] }) {
  const max = Math.max(1, ...data.map((item) => item.total));
  const points = data.map((item, index) => `${20 + index * 58},${122 - (item.total / max) * 94}`).join(" ");
  const issuePoints = data.map((item, index) => `${20 + index * 58},${122 - (item.issued / max) * 94}`).join(" ");
  return <Card title="Xu hướng văn bằng 6 tháng gần nhất" className="analytics-card"><div className="trend-legend"><span><i className="total" />Tổng tạo mới</span><span><i className="issued" />Đã cấp</span></div><svg className="trend-chart" viewBox="0 0 330 150" role="img" aria-label="Biểu đồ xu hướng cấp văn bằng"><path d="M20 122H310" /><polyline points={points} className="trend-total" /><polyline points={issuePoints} className="trend-issued" />{data.map((item, index) => <g key={item.month}><circle cx={20 + index * 58} cy={122 - (item.total / max) * 94} r="3.5" className="trend-total-dot" /><text x={20 + index * 58} y="143" textAnchor="middle">{item.month.slice(5)}</text></g>)}</svg></Card>;
}
function Ranking({ title, data }: { title: string; data: { name: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return <Card title={title} className="analytics-card"><div className="ranking-bars">{data.length ? data.map((item, index) => <div key={item.name}><div><span title={item.name}>{item.name}</span><b>{item.count}</b></div><i><em style={{ width: `${(item.count / max) * 100}%`, background: colors[index % colors.length] }} /></i></div>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />}</div></Card>;
}

export function DashboardPage() {
  const [data, setData] = useState<StatisticsOverview>();
  const [error, setError] = useState<string>();
  useEffect(() => { get<StatisticsOverview>("/admin/statistics/overview").then(setData).catch(() => setError("Không thể tải dữ liệu thống kê")); }, []);
  if (error) return <Alert type="error" showIcon message={error} />;
  if (!data) return <Spin size="large" />;
  const transactionColumns: ColumnsType<StatisticsOverview["recentTransactions"][number]> = [
    { title: "Thao tác", dataIndex: "action", render: (value: Transaction["action"]) => value === "ISSUE_CERTIFICATE" ? "Cấp văn bằng" : "Thu hồi" },
    { title: "Mã giao dịch", dataIndex: "transactionHash", render: (value) => value ? <Typography.Text copyable ellipsis={{ tooltip: value }}>{value.slice(0, 12)}…{value.slice(-8)}</Typography.Text> : "Chưa gửi" },
    { title: "Trạng thái", dataIndex: "status", render: (value) => <Tag color={value === "CONFIRMED" ? "green" : value === "FAILED" ? "red" : "blue"}>{transactionLabels[value] ?? value}</Tag> },
    { title: "Thời gian", dataIndex: "createdAt", render: (value) => new Date(value).toLocaleString("vi-VN") },
  ];
  return <div className="analytics-dashboard">
    <Typography.Title level={2}>Tổng quan hệ thống</Typography.Title>
    <Typography.Paragraph type="secondary">Số liệu được tổng hợp trực tiếp từ dữ liệu sinh viên, văn bằng, Blockchain và yêu cầu tư vấn.</Typography.Paragraph>
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="Tổng sinh viên" value={data.summary.students} prefix={<TeamOutlined />} /></Card></Col>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="Tổng văn bằng" value={data.summary.certificates} prefix={<SafetyCertificateOutlined />} /></Card></Col>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="Văn bằng đã cấp" value={countOf(data.certificateStatus, "ISSUED")} prefix={<FileDoneOutlined />} valueStyle={{ color: "#159461" }} /></Card></Col>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="Giao dịch xác nhận" value={countOf(data.transactionStatus, "CONFIRMED")} prefix={<DatabaseOutlined />} valueStyle={{ color: "#2859d9" }} /></Card></Col>
    </Row>
    <Row gutter={[16, 16]} className="analytics-row">
      <Col xs={24} lg={14}><TrendChart data={data.issueTrend} /></Col>
      <Col xs={24} lg={10}><StatusBars title="Trạng thái văn bằng" data={data.certificateStatus} labels={certificateLabels} /></Col>
      <Col xs={24} lg={12}><Ranking title="Văn bằng theo cơ sở đào tạo" data={data.byInstitution} /></Col>
      <Col xs={24} lg={12}><Ranking title="Sinh viên theo ngành" data={data.byMajor} /></Col>
      <Col xs={24} md={12}><StatusBars title="Đồng bộ Blockchain" data={data.blockchainStatus} labels={chainLabels} /></Col>
      <Col xs={24} md={12}><StatusBars title="Yêu cầu tư vấn" data={data.consultationStatus} labels={consultationLabels} /></Col>
    </Row>
    <Row gutter={[16, 16]} className="analytics-row">
      <Col xs={24} lg={9}><Card title="Dữ liệu đào tạo" className="analytics-card"><div className="catalog-stats"><span><BankOutlined /> {data.summary.institutions} cơ sở</span><span>{data.summary.majors} ngành</span><span>{data.summary.courses} khóa</span><span>{data.summary.classes} lớp</span></div></Card></Col>
      <Col xs={24} lg={15}><Card title="Giao dịch Blockchain gần nhất" className="analytics-card"><Table size="small" rowKey="_id" columns={transactionColumns} dataSource={data.recentTransactions} pagination={false} locale={{ emptyText: "Chưa có giao dịch" }} /></Card></Col>
    </Row>
  </div>;
}
