import { Select, Table, Typography, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { ApiClientError, get, patch } from "../../api/client";
import type { Consultation, PageResult } from "../../types/api";

const labels = { NEW: "Mới", CONTACTED: "Đã liên hệ", CLOSED: "Đã đóng" };

export function ConsultationsPage() {
  const [data, setData] = useState<PageResult<Consultation>>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await get<PageResult<Consultation>>(`/admin/consultations?page=${page}&limit=${limit}`));
    } catch (reason) {
      message.error(reason instanceof ApiClientError ? reason.message : "Không thể tải yêu cầu tư vấn");
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (id: string, status: Consultation["status"]) => {
    try {
      await patch(`/admin/consultations/${id}`, { status });
      message.success("Đã cập nhật trạng thái yêu cầu tư vấn");
      await load();
    } catch (reason) {
      message.error(reason instanceof ApiClientError ? reason.message : "Không thể cập nhật trạng thái");
    }
  };

  return <>
    <Typography.Title level={2}>Yêu cầu tư vấn</Typography.Title>
    <Table
      rowKey="_id"
      loading={loading}
      scroll={{ x: 900 }}
      dataSource={data?.items}
      pagination={{
        current: data?.meta.page ?? page,
        pageSize: data?.meta.limit ?? limit,
        total: data?.meta.total ?? 0,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50"],
        showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} yêu cầu`,
      }}
      onChange={(pagination) => {
        setPage(pagination.current ?? 1);
        setLimit(pagination.pageSize ?? limit);
      }}
      columns={[
        { title: "Người gửi", render: (_, item) => <><div>{item.fullName}</div><Typography.Text type="secondary">{item.email}</Typography.Text></> },
        { title: "Đơn vị", dataIndex: "organization" },
        { title: "Liên hệ", dataIndex: "phone" },
        { title: "Nhu cầu", dataIndex: "interest", render: (value) => value ?? "—" },
        { title: "Nội dung", dataIndex: "message", render: (value) => value ?? "—" },
        { title: "Trạng thái", render: (_, item) => <Select value={item.status} style={{ minWidth: 135 }} options={Object.entries(labels).map(([value, label]) => ({ value, label }))} onChange={(status) => void updateStatus(item._id, status)} /> },
        { title: "Ngày gửi", dataIndex: "createdAt", render: (value) => new Date(value).toLocaleString("vi-VN") },
      ]}
    />
  </>;
}
