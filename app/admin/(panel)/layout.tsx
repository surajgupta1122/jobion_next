import type { ReactNode } from "react";
import AdminLayout from "@/app/components/layout/admin-layout/AdminLayout.jsx";

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

