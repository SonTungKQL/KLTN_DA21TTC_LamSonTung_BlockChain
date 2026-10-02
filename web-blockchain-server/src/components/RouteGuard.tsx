import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { getSession, type UserRole } from "../auth/session";

export function RouteGuard({
  role,
  children,
}: PropsWithChildren<{ role: UserRole }>) {
  const session = getSession();
  if (!session) return <Navigate replace to="/login" />;
  if (session.role !== role)
    return (
      <Navigate
        replace
        to={
          session.role === "ADMIN"
            ? "/admin/dashboard"
            : "/student/certificates"
        }
      />
    );
  return <>{children}</>;
}
