import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { ApiClientError, get, patch, post } from "../../api/client";
import type { Course, Institution, Major, TrainingClass } from "../../types/api";

type CatalogKind = "major" | "course" | "class";
type CatalogItem = Major | Course | TrainingClass;
interface CatalogForm { institutionId: string; code: string; name: string; startYear?: number; majorId?: string; courseId?: string; }

const labels: Record<CatalogKind, string> = { major: "ngành", course: "khóa", class: "lớp" };

export function AcademicCatalogsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [kind, setKind] = useState<CatalogKind>("major");
  const [modalKind, setModalKind] = useState<CatalogKind>();
  const [editing, setEditing] = useState<CatalogItem>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<CatalogForm>();
  const selectedInstitutionId = Form.useWatch("institutionId", form);

  const load = async () => {
    try {
      const [institutionItems, majorItems, courseItems, classItems] = await Promise.all([
        get<Institution[]>("/admin/institutions"), get<Major[]>("/admin/academics/majors"), get<Course[]>("/admin/academics/courses"), get<TrainingClass[]>("/admin/academics/classes"),
      ]);
      setInstitutions(institutionItems); setMajors(majorItems); setCourses(courseItems); setClasses(classItems);
    } catch { setError("Không thể tải dữ liệu đào tạo"); }
  };
  useEffect(() => { void load(); }, []);

  const institutionName = (id: string) => institutions.find((item) => item._id === id)?.name ?? "—";
  const majorName = (id: string) => majors.find((item) => item._id === id)?.name ?? "—";
  const courseName = (id: string) => courses.find((item) => item._id === id)?.name ?? "—";
  const open = (nextKind: CatalogKind, item?: CatalogItem) => { setError(undefined); setModalKind(nextKind); setEditing(item); form.resetFields(); if (item) form.setFieldsValue(item); };
  const save = async () => {
    if (!modalKind) return;
    try {
      setSaving(true);
      const values = await form.validateFields();
      const path = `/admin/academics/${modalKind === "class" ? "classes" : `${modalKind}s`}`;
      if (editing) await patch(`${path}/${editing._id}`, values); else await post(path, values);
      message.success(`Đã ${editing ? "cập nhật" : "thêm"} ${labels[modalKind]}`);
      setModalKind(undefined); setEditing(undefined); form.resetFields(); await load();
    } catch (reason) { if (reason instanceof ApiClientError) setError(reason.message); }
    finally { setSaving(false); }
  };

  const majorColumns: ColumnsType<Major> = [
    { title: "Mã ngành", dataIndex: "code" }, { title: "Tên ngành", dataIndex: "name" },
    { title: "Cơ sở đào tạo", dataIndex: "institutionId", render: institutionName },
    { title: "", render: (_, item) => <Button icon={<EditOutlined />} onClick={() => open("major", item)}>Sửa</Button> },
  ];
  const courseColumns: ColumnsType<Course> = [
    { title: "Mã khóa", dataIndex: "code" }, { title: "Tên khóa", dataIndex: "name" }, { title: "Năm bắt đầu", dataIndex: "startYear", render: (value) => value ?? "—" },
    { title: "Cơ sở đào tạo", dataIndex: "institutionId", render: institutionName },
    { title: "", render: (_, item) => <Button icon={<EditOutlined />} onClick={() => open("course", item)}>Sửa</Button> },
  ];
  const classColumns: ColumnsType<TrainingClass> = [
    { title: "Mã lớp", dataIndex: "code" }, { title: "Tên lớp", dataIndex: "name" }, { title: "Ngành", dataIndex: "majorId", render: majorName }, { title: "Khóa", dataIndex: "courseId", render: courseName },
    { title: "Cơ sở đào tạo", dataIndex: "institutionId", render: institutionName },
    { title: "", render: (_, item) => <Button icon={<EditOutlined />} onClick={() => open("class", item)}>Sửa</Button> },
  ];
  const currentMajorOptions = majors.filter((item) => item.institutionId === selectedInstitutionId).map((item) => ({ value: item._id, label: `${item.code} — ${item.name}` }));
  const currentCourseOptions = courses.filter((item) => item.institutionId === selectedInstitutionId).map((item) => ({ value: item._id, label: `${item.code} — ${item.name}` }));

  return <>
    <Space className="page-heading"><Typography.Title level={2}>Danh mục đào tạo</Typography.Title><Button type="primary" icon={<PlusOutlined />} onClick={() => open(kind)}>Thêm {labels[kind]}</Button></Space>
    <Typography.Paragraph type="secondary">Thiết lập theo thứ tự: cơ sở đào tạo, ngành và khóa, sau đó tạo lớp thuộc đúng ngành và khóa.</Typography.Paragraph>
    {error && <Alert className="mb" type="error" showIcon message={error} />}
    <Card><Tabs activeKey={kind} onChange={(key) => setKind(key as CatalogKind)} items={[
      { key: "major", label: "Ngành", children: <Table rowKey="_id" columns={majorColumns} dataSource={majors} /> },
      { key: "course", label: "Khóa", children: <Table rowKey="_id" columns={courseColumns} dataSource={courses} /> },
      { key: "class", label: "Lớp", children: <Table rowKey="_id" columns={classColumns} dataSource={classes} scroll={{ x: 850 }} /> },
    ]} /></Card>
    <Modal open={Boolean(modalKind)} title={modalKind ? `${editing ? "Sửa" : "Thêm"} ${labels[modalKind]}` : ""} onCancel={() => setModalKind(undefined)} onOk={save} confirmLoading={saving} okText="Lưu" cancelText="Hủy">
      <Form form={form} layout="vertical" onValuesChange={(changed) => { if (changed.institutionId) form.setFieldsValue({ majorId: undefined, courseId: undefined }); }}>
        <Form.Item label="Cơ sở đào tạo" name="institutionId" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={institutions.map((item) => ({ value: item._id, label: `${item.code} — ${item.name}` }))} /></Form.Item>
        <Form.Item label={`Mã ${modalKind ? labels[modalKind] : ""}`} name="code" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label={`Tên ${modalKind ? labels[modalKind] : ""}`} name="name" rules={[{ required: true }]}><Input /></Form.Item>
        {modalKind === "course" && <Form.Item label="Năm bắt đầu" name="startYear"><InputNumber className="full" min={1900} max={3000} /></Form.Item>}
        {modalKind === "class" && <><Form.Item label="Ngành" name="majorId" rules={[{ required: true }]}><Select disabled={!selectedInstitutionId} options={currentMajorOptions} /></Form.Item><Form.Item label="Khóa" name="courseId" rules={[{ required: true }]}><Select disabled={!selectedInstitutionId} options={currentCourseOptions} /></Form.Item></>}
      </Form>
    </Modal>
  </>;
}
