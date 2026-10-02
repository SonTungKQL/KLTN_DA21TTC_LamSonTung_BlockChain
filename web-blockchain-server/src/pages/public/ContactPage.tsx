import {
  BankOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateFilled,
  SendOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Alert, Button, Form, Input, Modal } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiClientError, post } from "../../api/client";
import { getSession, saveSession } from "../../auth/session";
import type { Role } from "../../types/api";

type ConsultationForm = {
  fullName: string;
  phone: string;
  organization: string;
  interest?: string;
  message?: string;
};

export function ContactPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<ConsultationForm>();
  const [loginOpen, setLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (values: ConsultationForm) => {
    if (!getSession()) {
      setLoginOpen(true);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      await post("/consultations", values);
      setSuccess(true);
      form.resetFields(["message"]);
    } catch (reason) {
      setError(
        reason instanceof ApiClientError
          ? reason.message
          : "Không thể gửi yêu cầu tư vấn",
      );
    } finally {
      setLoading(false);
    }
  };
  const login = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await post<{
        accessToken: string;
        user: { role: Role; fullName: string; email: string };
      }>("/auth/login", values);
      saveSession({
        token: data.accessToken,
        role: data.user.role,
        fullName: data.user.fullName,
        email: data.user.email,
      });
      form.setFieldsValue({
        fullName: form.getFieldValue("fullName") || data.user.fullName,
      });
      setLoginOpen(false);
      await submit(form.getFieldsValue());
      navigate("/");
    } catch (reason) {
      setError(
        reason instanceof ApiClientError
          ? reason.message
          : "Không thể đăng nhập",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="contact-page">
      <section className="contact-hero">
        <span>
          <i /> KẾT NỐI &amp; HỢP TÁC
        </span>
        <h1>
          Đồng hành cùng
          <br />
          <em>chuyển đổi số giáo dục.</em>
        </h1>
        <p>
          Liên hệ với Certificate Chain để trao đổi về quản lý, cấp phát và xác
          thực văn bằng số cho đơn vị của bạn.
        </p>
      </section>
      <div className="contact-grid">
        <aside className="contact-details">
          <article>
            <span className="contact-icon">
              <BankOutlined />
            </span>
            <h2>Thông tin liên hệ</h2>
            <p>
              Đội ngũ hỗ trợ sẵn sàng giải đáp về quy trình sử dụng và xác thực
              văn bằng.
            </p>
            <div className="contact-item">
              <PhoneOutlined />
              <div>
                <b>Hỗ trợ chung</b>
                <a href="tel:19008899">1900 8899</a>
                <small>Thứ 2 – Thứ 6, 8:00 – 18:00</small>
              </div>
            </div>
            <div className="contact-item">
              <MailOutlined />
              <div>
                <b>Email hỗ trợ</b>
                <a href="mailto:support@certchain.vn">support@certchain.vn</a>
                <small>Phản hồi trong giờ làm việc</small>
              </div>
            </div>
            <div className="contact-item">
              <EnvironmentOutlined />
              <div>
                <b>Trụ sở</b>
                <span>phường Trà Vinh, tỉnh Vĩnh Long</span>
              </div>
            </div>
          </article>
          <article className="contact-trust">
            <SafetyCertificateFilled />
            <div>
              <b>Gửi yêu cầu an toàn</b>
              <p>
                Yêu cầu tư vấn được liên kết với tài khoản để đội ngũ quản trị
                có thể theo dõi và phản hồi.
              </p>
            </div>
          </article>
        </aside>
        <section className="contact-form-card">
          <div className="contact-form-heading">
            <span>YÊU CẦU TƯ VẤN</span>
            <h2>Hãy cho chúng tôi biết nhu cầu của bạn</h2>
            <p>
              Bạn cần đăng nhập để gửi yêu cầu. Tài khoản sinh viên hoặc quản
              trị đều có thể sử dụng chức năng này.
            </p>
          </div>
          {error && (
            <Alert className="mb" type="error" message={error} showIcon />
          )}
          {success && (
            <div className="contact-success">
              <CheckCircleFilled /> Đã gửi yêu cầu tư vấn. Đội ngũ quản trị sẽ
              liên hệ với bạn.
            </div>
          )}
          <Form form={form} layout="vertical" onFinish={submit}>
            <div className="contact-form-row">
              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[{ required: true, message: "Nhập họ tên" }]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[{ required: true, message: "Nhập số điện thoại" }]}
              >
                <Input placeholder="0912 345 678" />
              </Form.Item>
            </div>
            <div className="contact-form-row">
              <Form.Item
                label="Tên đơn vị"
                name="organization"
                rules={[{ required: true, message: "Nhập tên đơn vị" }]}
              >
                <Input placeholder="Tên trường / doanh nghiệp" />
              </Form.Item>
              <Form.Item label="Nhu cầu quan tâm" name="interest">
                <Input placeholder="Cấp và quản lý văn bằng số" />
              </Form.Item>
            </div>
            <Form.Item label="Nội dung cần tư vấn" name="message">
              <Input.TextArea
                rows={5}
                placeholder="Mô tả ngắn về nhu cầu của đơn vị..."
              />
            </Form.Item>
            <div className="contact-form-foot">
              <span>
                <LockOutlined /> Thông tin chỉ được dùng để phản hồi yêu cầu.
              </span>
              <Button type="primary" htmlType="submit" loading={loading}>
                Gửi yêu cầu tư vấn <SendOutlined />
              </Button>
            </div>
          </Form>
        </section>
      </div>
      <section className="contact-bottom">
        <TeamOutlined />
        <div>
          <h2>Sẵn sàng bắt đầu với Certificate Chain?</h2>
          <p>Đăng nhập để quản lý văn bằng hoặc gửi yêu cầu tư vấn.</p>
        </div>
      </section>
      <Modal
        title="Đăng nhập để gửi yêu cầu tư vấn"
        open={loginOpen}
        onCancel={() => setLoginOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <p className="modal-login-note">
          Vui lòng đăng nhập. Sau khi thành công, yêu cầu tư vấn của bạn sẽ được
          gửi tự động.
        </p>
        <Form layout="vertical" onFinish={login}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Button block type="primary" htmlType="submit" loading={loading}>
            Đăng nhập và gửi yêu cầu
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
