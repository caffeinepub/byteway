import type { ReactNode } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import SubadminDashboardPage from "../../pages/admin/SubadminDashboardPage";
import AdminLoginForm from "./AdminLoginForm";

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isAdmin, isSubadmin } = useAdminAuth();

  // Not authenticated — show unified login form
  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  // Subadmin — show restricted blog-only dashboard
  if (isSubadmin) {
    return <SubadminDashboardPage />;
  }

  // Full admin — render children (AdminDashboardPage)
  if (isAdmin) {
    return <>{children}</>;
  }

  // Fallback (should not reach here)
  return <AdminLoginForm />;
}
