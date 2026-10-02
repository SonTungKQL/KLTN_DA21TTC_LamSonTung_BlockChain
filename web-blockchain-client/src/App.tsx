import { ConfigProvider, message } from "antd";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { sessionExpiredEvent } from "./auth/session";
import { DocumentMeta } from "./components/DocumentMeta";
import { RouteGuard } from "./components/RouteGuard";
import { AdminLayout, PublicLayout, StudentLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { CertificateDetailPage } from "./pages/admin/CertificateDetailPage";
import { CertificateFormPage } from "./pages/admin/CertificateFormPage";
import { CertificatesPage } from "./pages/admin/CertificatesPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { InstitutionsPage } from "./pages/admin/InstitutionsPage";
import { StudentDetailPage } from "./pages/admin/StudentDetailPage";
import { StudentEditPage } from "./pages/admin/StudentEditPage";
import { StudentFormPage } from "./pages/admin/StudentFormPage";
import { StudentsPage } from "./pages/admin/StudentsPage";
import { TransactionsPage } from "./pages/admin/TransactionsPage";
import { ConsultationsPage } from "./pages/admin/ConsultationsPage";
import { AcademicCatalogsPage } from "./pages/admin/AcademicCatalogsPage";
import { AdvancedSettingsPage } from "./pages/admin/AdvancedSettingsPage";
import { PublicLookupPage } from "./pages/public/PublicLookupPage";
import { HomePage } from "./pages/public/HomePage";
import { FeaturesPage } from "./pages/public/FeaturesPage";
import { ContactPage } from "./pages/public/ContactPage";
import { ProcessPage } from "./pages/public/ProcessPage";
import { VerifyPage } from "./pages/public/VerifyPage";
import { StudentCertificateDetailPage } from "./pages/student/StudentCertificateDetailPage";
import { StudentCertificatesPage } from "./pages/student/StudentCertificatesPage";

function SessionExpiryHandler() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const handleSessionExpired = () => {
      messageApi.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/login", { replace: true });
    };
    window.addEventListener(sessionExpiredEvent, handleSessionExpired);
    return () => window.removeEventListener(sessionExpiredEvent, handleSessionExpired);
  }, [messageApi, navigate]);

  return contextHolder;
}

export function App() {
  return <ConfigProvider theme={{ token: { colorPrimary: "#2859d9", borderRadius: 10, fontFamily: "Inter, system-ui, sans-serif" } }}>
    <BrowserRouter><SessionExpiryHandler /><DocumentMeta /><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<RouteGuard role="ADMIN"><AdminLayout /></RouteGuard>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/create" element={<StudentFormPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="students/:id/edit" element={<StudentEditPage />} />
        <Route path="institutions" element={<InstitutionsPage />} />
        <Route path="academics" element={<AcademicCatalogsPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="certificates/create" element={<CertificateFormPage />} />
        <Route path="certificates/:id" element={<CertificateDetailPage />} />
        <Route path="blockchain-transactions" element={<TransactionsPage />} />
        <Route path="consultations" element={<ConsultationsPage />} />
        <Route path="advanced-settings" element={<AdvancedSettingsPage />} />
      </Route>
      <Route path="/student" element={<RouteGuard role="STUDENT"><StudentLayout /></RouteGuard>}>
        <Route path="certificates" element={<StudentCertificatesPage />} />
        <Route path="certificates/:id" element={<StudentCertificateDetailPage />} />
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/process" element={<ProcessPage />} />
        <Route path="/verify" element={<PublicLookupPage />} />
        <Route path="/verify/:certificateCode" element={<VerifyPage />} />
      </Route>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate replace to="/verify" />} />
    </Routes></BrowserRouter>
  </ConfigProvider>;
}
