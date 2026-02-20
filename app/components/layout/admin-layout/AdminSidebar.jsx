"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  User,
  Users,
  Menu,
  Clock,
  CheckCircle,
  FileText,
  XCircle,
  Archive,
  LogOut,
  Tag,
  FileCheck
} from "lucide-react";
import api from "../../../components/apiconfig/apiconfig";

/**
 * Admin Sidebar - For admin dashboard
 */
const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Define menu items
  const menuItems = [
    { title: "Dashboard", icon: <LayoutDashboard />, path: "/admin" },
    { title: "Pending Recruiters", icon: <Clock />, path: "/admin/pending-recruiters" },
    { title: "Verified Recruiters", icon: <CheckCircle />, path: "/admin/verified-recruiters" },
    { title: "Users", icon: <User />, path: "/admin/users" },
    { title: "Jobs", icon: <FileText />, path: "/admin/jobs" },
    { title: "Pending Jobs", icon: <Clock />, path: "/admin/pending-jobs" },
    { title: "Approved Jobs", icon: <CheckCircle />, path: "/admin/approved-jobs" },
    { title: "Rejected Jobs", icon: <XCircle />, path: "/admin/rejected-jobs" },
    { title: "Closed Jobs", icon: <Archive />, path: "/admin/closed-jobs" },
    { title: "Applications", icon: <FileCheck />, path: "/admin/applications" },
    { title: "Job Roles", icon: <Tag />, path: "/admin/job-roles" },
  ];

  const handleLogout = async () => {
    try {
      await api.post('/admin/auth/logout');
      router.push('/admin/signin');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to signin
      router.push('/admin/signin');
    }
  };

  return (
    <aside
      className={`h-screen border-r bg-white transition-all duration-300 fixed top-0 left-0 z-50
      ${isOpen ? "w-64" : "w-20"}`}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1
          className={`text-xl font-bold transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 hidden"
            }`}
        >
          Admin Panel
        </h1>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Menu Items */}
      <ul className="mt-4 space-y-2 px-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <li key={item.title}>
              <Link
                href={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer
                transition-all duration-200
                ${isActive
                    ? "bg-primary-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                  }
              `}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <span
                  className={`${isOpen ? "block" : "hidden"
                    } text-md font-medium whitespace-nowrap`}
                >
                  {item.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-2 border-t">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-4 w-full px-4 py-3 rounded-lg cursor-pointer
            transition-all duration-200 text-primary-600 hover:bg-primary-50
            ${!isOpen ? "justify-center" : ""}
          `}
        >
          <LogOut size={20} />
          <span
            className={`${isOpen ? "block" : "hidden"
              } text-md font-medium whitespace-nowrap`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

