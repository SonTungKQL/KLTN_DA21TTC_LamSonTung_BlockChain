import {
  ApiOutlined,
  ArrowRightOutlined,
  BankOutlined,
  CheckCircleFilled,
  DatabaseOutlined,
  FileProtectOutlined,
  KeyOutlined,
  LockOutlined,
  LoginOutlined,
  QrcodeOutlined,
  SafetyCertificateFilled,
  SearchOutlined,
  SecurityScanOutlined,
  TeamOutlined,
  AppstoreOutlined,
  HomeOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Dropdown } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearSession, getSession, sessionChangedEvent } from "../../auth/session";

const benefits = [
  {
    icon: <SearchOutlined />,
    title: "Xác thực tức thì",
    description:
      "Kiểm tra tính hợp lệ của văn bằng chỉ trong vài giây bằng mã định danh hoặc mã QR.",
    accent: "blue",
  },
  {
    icon: <DatabaseOutlined />,
    title: "Dữ liệu minh bạch",
    description:
      "Thông tin phát hành được ghi nhận trên Blockchain, sẵn sàng để đối chiếu khi cần.",
    accent: "cyan",
  },
  {
    icon: <FileProtectOutlined />,
    title: "Chống giả mạo",
    description:
      "Mỗi văn bằng có dấu vết mật mã riêng, giúp phát hiện mọi thay đổi trái phép.",
    accent: "violet",
  },
  {
    icon: <TeamOutlined />,
    title: "Quản lý tập trung",
    description:
      "Cơ sở đào tạo quản lý cấp phát, xác thực và thu hồi văn bằng trong một hệ thống.",
    accent: "blue",
  },
];

const steps = [
  {
    number: "01",
    title: "Cấp văn bằng",
    description:
      "Cơ sở đào tạo tạo và phê duyệt hồ sơ văn bằng điện tử cho người học.",
  },
  {
    number: "02",
    title: "Ghi nhận Blockchain",
    description:
      "Dấu vân tay dữ liệu được băm và lưu thành giao dịch bất biến trên chuỗi khối.",
  },
  {
    number: "03",
    title: "Quét QR & xác thực",
    description:
      "Sinh viên, nhà tuyển dụng hoặc đơn vị xác minh nhận kết quả ngay lập tức.",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const [certificateCode, setCertificateCode] = useState("");
  const [session, setSession] = useState(getSession());
  useEffect(() => {
    const refreshSession = () => setSession(getSession());
    window.addEventListener(sessionChangedEvent, refreshSession);
    return () => window.removeEventListener(sessionChangedEvent, refreshSession);
  }, []);
  const verifyCertificate = () => {
    const value = certificateCode.trim().toUpperCase();
    if (value) navigate(`/verify/${encodeURIComponent(value)}`);
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-inner">
          <Link className="home-brand" to="/">
            <img src="/certificate-chain-logo.png" alt="Certificate Chain" />
            <span>
              <strong>Certificate Chain</strong>
              <small>Nền tảng xác thực văn bằng số</small>
            </span>
          </Link>
          <nav className="home-nav" aria-label="Điều hướng trang chủ">
            <Link to="/verify">Tra cứu</Link>
            <Link to="/features">Tính năng</Link>
            <Link to="/process">Quy trình</Link>
            <Link to="/contact">Liên hệ</Link>
          </nav>
          <div className="home-actions">
            <Link className="home-quick-link" to="/verify">
              <SearchOutlined /> Tra cứu nhanh
            </Link>
            {session ? <Dropdown menu={{ items: [{ key: "home", icon: <HomeOutlined />, label: "Trang chủ", onClick: () => navigate("/") }, { key: "portal", icon: session.role === "ADMIN" ? <AppstoreOutlined /> : <SafetyCertificateFilled />, label: session.role === "ADMIN" ? "Cổng quản trị" : "Văn bằng của tôi", onClick: () => navigate(session.role === "ADMIN" ? "/admin/dashboard" : "/student/certificates") }, { type: "divider" }, { key: "logout", icon: <LogoutOutlined />, label: "Đăng xuất", onClick: () => { clearSession(); navigate("/login"); } }] }}><Button className="home-login-link home-user-link" type="text"><Avatar size="small">{session.fullName?.slice(0, 1) ?? "U"}</Avatar>{session.fullName ?? session.email}</Button></Dropdown> : <Link className="home-login-link" to="/login"><LoginOutlined /> Đăng nhập</Link>}
          </div>
        </div>
      </header>

      <main>
        <section className="home-hero">
          <div className="home-hero-grid">
            <div className="hero-copy">
              <div className="home-eyebrow"><span /> Hệ sinh thái văn bằng số trên Blockchain</div>
              <h1>Văn bằng số minh bạch.<br /><em>Xác thực tức thì.</em></h1>
              <p>
                Certificate Chain giúp cơ sở đào tạo cấp phát và quản lý văn bằng số an toàn;
                sinh viên, nhà tuyển dụng có thể kiểm chứng tính hợp lệ chỉ trong vài giây.
              </p>
              <div className="hero-ctas">
                <Link className="home-primary-button" to="/verify"><SafetyCertificateFilled /> Tra cứu văn bằng</Link>
                <Link className="home-secondary-button" to="/login"><LoginOutlined /> Đăng nhập hệ thống</Link>
              </div>
              <div className="hero-trust-row">
                <span><LockOutlined /> Mã hóa SHA-256</span>
                <span><ApiOutlined /> Dữ liệu On-chain</span>
                <span><CheckCircleFilled /> Kiểm chứng minh bạch</span>
              </div>
            </div>

            <div className="certificate-showcase" aria-label="Minh họa văn bằng số đã xác thực">
              <div className="showcase-glow" />
              <article className="sample-certificate">
                <div className="certificate-topline">
                  <div className="certificate-school"><span><BankOutlined /></span><div><strong>Cơ sở đào tạo</strong><small>Smart contract verified</small></div></div>
                  <b className="valid-status"><i /> Hợp lệ</b>
                </div>
                <div className="certificate-body">
                  <small>VĂN BẰNG CỬ NHÂN</small>
                  <h2>Kỹ thuật phần mềm</h2>
                  <div className="certificate-fields">
                    <div><span>Người học</span><strong>Nguyễn Văn An</strong></div>
                    <div><span>Xếp loại</span><strong>Xuất sắc</strong></div>
                  </div>
                  <div className="certificate-verify-strip">
                    <div className="sample-qr"><QrcodeOutlined /></div>
                    <div><strong>Quét để xác thực On-chain</strong><span>Mã: CC-2026-000001</span></div>
                    <SecurityScanOutlined />
                  </div>
                </div>
                <div className="certificate-hash"><span>TX Hash</span><code>0x7f9a8b1c...903c2e</code><b>Block #18,924,102</b></div>
              </article>
            </div>
          </div>
        </section>

        <section className="lookup-section" id="tra-cuu">
          <div className="lookup-panel">
            <div><span className="lookup-icon"><KeyOutlined /></span><div><h2>Tra cứu tính hợp lệ văn bằng</h2><p>Nhập mã văn bằng để kiểm chứng dữ liệu được ghi nhận trên Blockchain.</p></div></div>
            <div className="lookup-form">
              <input aria-label="Mã văn bằng" value={certificateCode} onChange={(event) => setCertificateCode(event.target.value)} onKeyDown={(event) => event.key === "Enter" && verifyCertificate()} placeholder="VD: TVU-2026-000001" />
              <button type="button" onClick={verifyCertificate} disabled={!certificateCode.trim()}><SearchOutlined /> Xác thực ngay</button>
            </div>
          </div>
        </section>

        <section className="home-section feature-section" id="tinh-nang">
          <div className="section-heading"><span>TÍNH NĂNG NỔI BẬT</span><h2>Niềm tin số cho mọi văn bằng</h2><p>Một nền tảng đơn giản để cấp phát, lưu trữ và xác minh thông tin học thuật đáng tin cậy.</p></div>
          <div className="benefit-grid">
            {benefits.map((benefit) => <article className={`benefit-card ${benefit.accent}`} key={benefit.title}><div className="benefit-icon">{benefit.icon}</div><h3>{benefit.title}</h3><p>{benefit.description}</p><span>Tìm hiểu thêm <ArrowRightOutlined /></span></article>)}
          </div>
        </section>

        <section className="home-section process-section" id="quy-trinh">
          <div className="section-heading"><span>QUY TRÌNH 3 BƯỚC</span><h2>Đơn giản cho cả cấp phát và xác thực</h2></div>
          <div className="steps-grid">
            {steps.map((step) => <article className="step-card" key={step.number}><b>{step.number}</b><h3>{step.title}</h3><p>{step.description}</p></article>)}
          </div>
        </section>

        <section className="home-stats">
          <div><strong>100%</strong><span>Dữ liệu có thể đối chiếu</span></div>
          <div><strong>24/7</strong><span>Tra cứu trực tuyến</span></div>
          <div><strong>QR</strong><span>Xác thực trong vài giây</span></div>
        </section>
      </main>

      <footer className="home-footer">
        <div><div className="home-footer-brand"><SafetyCertificateFilled /> Certificate Chain</div><p>Chuẩn mực tin cậy cho văn bằng số và xác thực học thuật trên Blockchain.</p></div>
        <div className="footer-links"><a href="#tra-cuu">Tra cứu văn bằng</a><a href="#tinh-nang">Tính năng</a><Link to="/login">Cổng đăng nhập</Link></div>
        <small>© 2026 Certificate Chain. Bảo lưu mọi quyền.</small>
      </footer>
    </div>
  );
}
