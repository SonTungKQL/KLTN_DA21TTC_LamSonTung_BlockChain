import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Select, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../api/client";
import {
  BlockchainStatusTag,
  CertificateStatusTag,
} from "../../components/StatusTags";
import type { Certificate, PageResult } from "../../types/api";
export function CertificatesPage() {
  const [data, setData] = useState<PageResult<Certificate>>();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const load = (page = 1) =>
    get<PageResult<Certificate>>(
      `/admin/certificates?page=${page}&limit=10&keyword=${encodeURIComponent(keyword)}${status ? `&status=${status}` : ""}`,
    ).then(setData);
  useEffect(() => {
    load();
  }, []);
  const columns: ColumnsType<Certificate> = [
    { title: "Mã bằng", dataIndex: "certificateCode" },
    { title: "Sinh viên", render: (_, x) => x.studentId?.fullName ?? "—" },
    { title: "Văn bằng", dataIndex: "certificateName" },
    {
      title: "Ngày cấp",
      dataIndex: "issueDate",
      render: (v) => new Date(v).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      render: (_, x) => <CertificateStatusTag status={x.status} />,
    },
    {
      title: "Blockchain",
      render: (_, x) => <BlockchainStatusTag status={x.blockchainStatus} />,
    },
    {
      title: "",
      render: (_, x) => (
        <Link to={`/admin/certificates/${x._id}`}>Chi tiết</Link>
      ),
    },
  ];
  return (
    <>
      <Space className="page-heading">
        <Typography.Title level={2}>Văn bằng</Typography.Title>
        <Link to="/admin/certificates/create">
          <Button type="primary" icon={<PlusOutlined />}>
            Cấp văn bằng
          </Button>
        </Link>
      </Space>
      <Space className="toolbar" wrap>
        <Input
          placeholder="Tìm mã hoặc tên"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => load()}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          value={status}
          onChange={setStatus}
          options={[
            { value: "PENDING", label: "Đang xử lý" },
            { value: "ISSUED", label: "Đã cấp" },
            { value: "BLOCKCHAIN_FAILED", label: "Blockchain lỗi" },
            { value: "REVOKED", label: "Đã thu hồi" },
          ]}
        />
        <Button onClick={() => load()}>Lọc</Button>
      </Space>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={data?.items}
        loading={!data}
        scroll={{ x: 900 }}
        pagination={{
          current: data?.meta.page,
          total: data?.meta.total,
          pageSize: 10,
          onChange: load,
        }}
      />
    </>
  );
}
