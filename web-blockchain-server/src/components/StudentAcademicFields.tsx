import { Form, Select } from "antd";
import type { FormInstance } from "antd";
import { useEffect, useState } from "react";
import { get } from "../api/client";
import type { Course, Institution, Major, TrainingClass } from "../types/api";

export function StudentAcademicFields({ form }: { form: FormInstance }) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const institutionId = Form.useWatch("institutionId", form);
  const majorId = Form.useWatch("majorId", form);
  const courseId = Form.useWatch("courseId", form);

  useEffect(() => {
    Promise.all([
      get<Institution[]>("/admin/institutions"),
      get<Major[]>("/admin/academics/majors"),
      get<Course[]>("/admin/academics/courses"),
      get<TrainingClass[]>("/admin/academics/classes"),
    ]).then(([institutionItems, majorItems, courseItems, classItems]) => {
      setInstitutions(institutionItems);
      setMajors(majorItems);
      setCourses(courseItems);
      setClasses(classItems);
    });
  }, []);

  const majorOptions = majors.filter((item) => item.institutionId === institutionId).map((item) => ({ value: item._id, label: `${item.code} — ${item.name}` }));
  const courseOptions = courses.filter((item) => item.institutionId === institutionId).map((item) => ({ value: item._id, label: `${item.code} — ${item.name}` }));
  const classOptions = classes.filter((item) => item.institutionId === institutionId && item.majorId === majorId && item.courseId === courseId).map((item) => ({ value: item._id, label: `${item.code} — ${item.name}` }));

  return <>
    <Form.Item label="Cơ sở đào tạo" name="institutionId" rules={[{ required: true, message: "Vui lòng chọn cơ sở đào tạo" }]}>
      <Select showSearch optionFilterProp="label" placeholder="Chọn cơ sở đào tạo" options={institutions.map((item) => ({ value: item._id, label: `${item.code} — ${item.name}` }))} onChange={() => form.setFieldsValue({ majorId: undefined, courseId: undefined, classId: undefined })} />
    </Form.Item>
    <Form.Item label="Ngành" name="majorId" rules={[{ required: true, message: "Vui lòng chọn ngành" }]}>
      <Select showSearch optionFilterProp="label" placeholder="Chọn ngành" disabled={!institutionId} options={majorOptions} onChange={() => form.setFieldsValue({ classId: undefined })} />
    </Form.Item>
    <Form.Item label="Khóa" name="courseId" rules={[{ required: true, message: "Vui lòng chọn khóa" }]}>
      <Select showSearch optionFilterProp="label" placeholder="Chọn khóa" disabled={!institutionId} options={courseOptions} onChange={() => form.setFieldsValue({ classId: undefined })} />
    </Form.Item>
    <Form.Item label="Lớp" name="classId" rules={[{ required: true, message: "Vui lòng chọn lớp" }]}>
      <Select showSearch optionFilterProp="label" placeholder="Chọn lớp" disabled={!institutionId || !majorId || !courseId} options={classOptions} />
    </Form.Item>
  </>;
}
