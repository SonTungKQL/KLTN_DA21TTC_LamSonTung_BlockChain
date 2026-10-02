import {
  CheckCircleFilled,
  LockOutlined,
  SafetyCertificateFilled,
  SearchOutlined,
} from "@ant-design/icons";
import { Input } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function PublicLookupPage() {
  const navigate = useNavigate();
  const [certificateCode, setCertificateCode] = useState("");
  const verify = () => {
    const input = certificateCode.trim();
    const isBlockchainIdentifier = input.toLowerCase().startsWith("0x");
    const identifier = isBlockchainIdentifier ? input : input.toUpperCase();
    if (identifier)
      navigate(
        `/verify/${encodeURIComponent(identifier)}${isBlockchainIdentifier ? "?source=hash" : ""}`,
      );
  };

  return (
    <div className="lookup-portal">
      <section className="lookup-portal-intro">
        <div className="network-pill">
          <span /> Mạng Blockchain đang đồng bộ dữ liệu
        </div>
        <h1>
          Cổng tra cứu &amp; xác thực
          <br />
          văn bằng số On-chain
        </h1>
        <p>
          Kiểm tra tính toàn vẹn của văn bằng bằng mã định danh. Mỗi kết quả
          được đối chiếu trực tiếp với dữ liệu đã ghi nhận trên Blockchain.
        </p>
      </section>

      <section
        className="verification-console"
        aria-label="Công cụ tra cứu văn bằng"
      >
        <div className="verification-tab-content">
          <div className="code-lookup-panel">
            <label htmlFor="certificate-code">
              Nhập mã số văn bằng hoặc mã định danh trên Blockchain
            </label>
            <div className="code-input-row">
              <Input
                id="certificate-code"
                className="certificate-lookup-input"
                prefix={<SearchOutlined />}
                suffix={<span className="hash-badge">SHA-256</span>}
                value={certificateCode}
                onChange={(event) => setCertificateCode(event.target.value)}
                onPressEnter={verify}
                placeholder="VD: TVU-2026-000001 hoặc 0x…"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={verify}
                disabled={!certificateCode.trim()}
              >
                <SafetyCertificateFilled /> Kiểm tra ngay
              </button>
            </div>
            <div className="lookup-hint">
              <span>Nhập mã được in trên văn bằng để bắt đầu xác thực.</span>
              <button
                type="button"
                onClick={() => setCertificateCode("TVU-2026-000001")}
              >
                Dùng mã mẫu
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="portal-assurance">
        <div className="assurance-heading">
          <span>QUY TRÌNH XÁC THỰC</span>
          <h2>Kết quả có cơ sở để tin cậy</h2>
          <p>
            Hệ thống chỉ trả về kết quả sau khi đối chiếu mã văn bằng và trạng
            thái trên dữ liệu Blockchain.
          </p>
        </div>
        <div className="assurance-grid">
          <article>
            <span className="assurance-icon blue">
              <LockOutlined />
            </span>
            <h3>Dữ liệu bất biến</h3>
            <p>
              Mã định danh của văn bằng được ghi nhận cùng dấu vết mật mã để
              phát hiện thay đổi trái phép.
            </p>
          </article>
          <article>
            <span className="assurance-icon cyan">
              <CheckCircleFilled />
            </span>
            <h3>Đối chiếu minh bạch</h3>
            <p>
              Trạng thái cấp phát hoặc thu hồi được hiển thị rõ ràng tại thời
              điểm xác thực.
            </p>
          </article>
          <article>
            <span className="assurance-icon violet">
              <SafetyCertificateFilled />
            </span>
            <h3>Bảo vệ quyền riêng tư</h3>
            <p>
              Chỉ những thông tin cần thiết cho việc xác thực mới được công khai
              cho người tra cứu.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
