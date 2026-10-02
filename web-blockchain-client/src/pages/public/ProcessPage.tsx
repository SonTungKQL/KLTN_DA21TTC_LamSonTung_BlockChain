import { CheckCircleFilled, DatabaseOutlined, FileTextOutlined, LockOutlined, QrcodeOutlined, SafetyCertificateFilled } from "@ant-design/icons";
import { Link } from "react-router-dom";

const stages = [
  { number: "01", icon: <FileTextOutlined />, title: "Chuẩn bị dữ liệu văn bằng", text: "Quản trị viên chọn sinh viên, cơ sở đào tạo, thông tin văn bằng và ngày cấp. Hệ thống tự tạo mã văn bằng duy nhất." },
  { number: "02", icon: <LockOutlined />, title: "Tạo dấu vết dữ liệu", text: "Thông tin cốt lõi được chuẩn hóa để tạo document hash, giúp phát hiện sai lệch dữ liệu trong lần xác thực sau." },
  { number: "03", icon: <DatabaseOutlined />, title: "Ghi nhận Blockchain", text: "Yêu cầu phát hành được gửi lên Blockchain. Hệ thống theo dõi transaction hash, block number và trạng thái xác nhận." },
  { number: "04", icon: <SafetyCertificateFilled />, title: "Công khai xác thực", text: "Khi văn bằng được cấp, người học và đơn vị xác minh có thể tra cứu mã văn bằng hoặc mã Blockchain." },
];

export function ProcessPage() {
  return <div className="process-page"><section className="process-hero"><span>QUY TRÌNH VẬN HÀNH</span><h1>Từ dữ liệu học vụ đến<br /><em>văn bằng số có thể xác thực.</em></h1><p>Certificate Chain tạo một luồng phát hành rõ ràng: dữ liệu được kiểm tra, ghi nhận và có thể xác minh công khai khi cần.</p><Link to="/verify">Tra cứu văn bằng <QrcodeOutlined /></Link></section>
    <section className="process-timeline">{stages.map((stage, index) => <article key={stage.number}><div className="stage-mark"><span>{stage.number}</span>{stage.icon}</div><div><h2>{stage.title}</h2><p>{stage.text}</p><small><CheckCircleFilled /> Bước {index + 1} trong quy trình phát hành</small></div></article>)}</section>
    <section className="process-explain"><div><span>TRẠNG THÁI MINH BẠCH</span><h2>Theo dõi từng lần phát hành và thu hồi</h2><p>Quản trị viên xem được trạng thái xử lý, lỗi Blockchain hoặc xác nhận hoàn tất. Khi cần thu hồi, hệ thống ghi nhận lý do và trạng thái mới để người tra cứu nhận biết.</p><ul><li><CheckCircleFilled /> Mã văn bằng được tự động tạo theo cơ sở và năm cấp</li><li><CheckCircleFilled /> Transaction hash và block number được lưu kèm văn bằng</li><li><CheckCircleFilled /> Kết quả xác thực phản ánh trạng thái hiện tại</li></ul></div><div className="process-ledger"><DatabaseOutlined /><b>Blockchain ledger</b><span>Thông tin phát hành được đối chiếu khi tra cứu</span><i>Confirmed</i></div></section>
    <section className="process-faq"><span>CÂU HỎI THƯỜNG GẶP</span><h2>Hiểu rõ quy trình xác thực</h2><div><article><h3>Ai có thể tra cứu văn bằng?</h3><p>Bất kỳ ai có mã văn bằng hoặc mã định danh Blockchain đều có thể dùng cổng xác thực công khai.</p></article><article><h3>Văn bằng thu hồi có còn tra cứu được không?</h3><p>Có. Kết quả sẽ hiển thị trạng thái đã thu hồi để tránh sử dụng văn bằng không còn hiệu lực.</p></article><article><h3>Khi Blockchain gặp lỗi thì sao?</h3><p>Hệ thống lưu trạng thái lỗi để quản trị viên có thể kiểm tra và gửi lại yêu cầu phát hành.</p></article></div></section></div>;
}
