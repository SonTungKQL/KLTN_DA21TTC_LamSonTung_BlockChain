import { ApiOutlined, BankOutlined, CheckCircleFilled, DatabaseOutlined, FileProtectOutlined, LockOutlined, SafetyCertificateFilled, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const modules = [
  { icon: <BankOutlined />, title: "Quản trị cơ sở đào tạo", text: "Quản lý cơ sở đào tạo, quyền phát hành và danh sách sinh viên trên một cổng quản trị tập trung.", color: "blue" },
  { icon: <SafetyCertificateFilled />, title: "Cấp phát văn bằng số", text: "Tự tạo mã văn bằng, tạo dấu vết dữ liệu và ghi nhận trạng thái phát hành trên Blockchain.", color: "cyan" },
  { icon: <SearchOutlined />, title: "Cổng xác thực công khai", text: "Người học và nhà tuyển dụng tra cứu văn bằng bằng mã phát hành hoặc mã định danh Blockchain.", color: "violet" },
  { icon: <FileProtectOutlined />, title: "Theo dõi trạng thái", text: "Theo dõi giao dịch phát hành, xác nhận, lỗi Blockchain và quá trình thu hồi văn bằng.", color: "blue" },
];

export function FeaturesPage() {
  return <div className="features-page">
    <section className="features-hero">
      <span className="features-eyebrow">HỆ THỐNG XÁC THỰC VĂN BẰNG SỐ</span>
      <h1>Những tính năng thiết yếu cho<br /><em>văn bằng đáng tin cậy.</em></h1>
      <p>Certificate Chain kết nối cơ sở đào tạo, người học và đơn vị xác minh trong một quy trình phát hành và kiểm chứng dữ liệu minh bạch.</p>
      <div className="features-actions"><a href="#phan-he">Khám phá tính năng</a><Link to="/verify">Tra cứu văn bằng</Link></div>
      <div className="features-metrics"><div><b>Nhanh</b><span>Tra cứu trực tuyến</span></div><div><b>Minh bạch</b><span>Đối chiếu Blockchain</span></div><div><b>An toàn</b><span>Dấu vết dữ liệu riêng</span></div><div><b>Rõ ràng</b><span>Trạng thái cấp & thu hồi</span></div></div>
    </section>

    <section className="feature-compare"><div className="features-heading"><span>GIÁ TRỊ KHÁC BIỆT</span><h2>Quản lý văn bằng, không chỉ lưu trữ tệp</h2><p>Quy trình được thiết kế để việc xác thực nhanh hơn, thông tin dễ đối chiếu hơn và trạng thái luôn rõ ràng.</p></div>
      <div className="comparison-table"><div className="comparison-head"><b>Tiêu chí</b><b>Quy trình thủ công</b><b>Certificate Chain</b></div><div><strong>Xác thực</strong><span>Liên hệ và kiểm tra thủ công</span><span><CheckCircleFilled /> Tra cứu trực tuyến bằng mã</span></div><div><strong>Trạng thái</strong><span>Khó theo dõi lịch sử phát hành</span><span><CheckCircleFilled /> Hiển thị cấp, lỗi hoặc thu hồi</span></div><div><strong>Toàn vẹn dữ liệu</strong><span>Dễ phụ thuộc vào bản sao tài liệu</span><span><CheckCircleFilled /> Đối chiếu dấu vết dữ liệu on-chain</span></div></div>
    </section>

    <section className="feature-modules" id="phan-he"><div className="features-heading"><span>4 PHÂN HỆ CỐT LÕI</span><h2>Một nền tảng, xuyên suốt vòng đời văn bằng</h2></div><div className="modules-grid">{modules.map((module, index) => <article className={`module-card ${module.color}`} key={module.title}><div><span className="module-icon">{module.icon}</span><small>MODULE 0{index + 1}</small></div><h3>{module.title}</h3><p>{module.text}</p><span className="module-detail">Dữ liệu rõ ràng, thao tác tập trung</span></article>)}</div></section>

    <section className="feature-security"><div><span><LockOutlined /> BẢO MẬT &amp; TOÀN VẸN</span><h2>Dữ liệu được kiểm chứng từ lúc phát hành</h2><p>Mỗi văn bằng được gắn mã định danh và dấu vết mật mã. Khi xác thực, hệ thống đối chiếu dữ liệu lưu trữ với bản ghi Blockchain để trả về trạng thái phù hợp.</p><ul><li><CheckCircleFilled /> Dấu vết dữ liệu riêng cho từng văn bằng</li><li><CheckCircleFilled /> Tra cứu bằng mã văn bằng hoặc mã Blockchain</li><li><CheckCircleFilled /> Hỗ trợ kiểm tra trạng thái thu hồi</li></ul><Link to="/verify">Kiểm tra một văn bằng <SearchOutlined /></Link></div><div className="security-visual"><DatabaseOutlined /><span>Blockchain record</span><b>Verified</b></div></section>

    <section className="features-cta"><div><span>CHUYỂN ĐỔI SỐ VĂN BẰNG</span><h2>Bắt đầu xác thực văn bằng ngay hôm nay</h2><p>Truy cập cổng tra cứu công khai hoặc đăng nhập để quản lý dữ liệu văn bằng của đơn vị.</p><Link to="/verify">Tra cứu văn bằng</Link><Link to="/login">Đăng nhập hệ thống</Link></div><TeamOutlined /></section>
  </div>;
}
