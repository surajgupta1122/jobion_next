import React from 'react';
import Link from 'next/link';

/**
 * Candidate Sidebar - For user/candidate dashboard
 */
export default function CandidateSidebar({
  sidebarOpen,
  mobileSidebarOpen,
  userData,
  onToggleSidebar,
  onLogout,
  currentPath,
  setMobileSidebarOpen
}) {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/jobs', label: 'Find Jobs' },
    { path: '/dashboard/saved', label: 'Saved' },
    { path: '/dashboard/applied', label: 'Applications' },
    { path: '/dashboard/profile', label: 'Profile' },
    { path: '/dashboard/alerts', label: 'Notifications' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200">
          <h1 className="text-xl font-semibold tracking-tight">Jobion</h1>
          <p className="text-xs text-slate-500 mt-1">Applicant Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg font-medium
                ${currentPath === item.path
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-primary-600 hover:bg-primary-50"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        md:hidden fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-6 py-4 border-b border-slate-200">
          <h1 className="text-xl font-semibold tracking-tight">Jobion</h1>
          <p className="text-xs text-slate-500 mt-1">Applicant Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg font-medium
                ${currentPath === item.path
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
                }
              `}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-primary-600 hover:bg-primary-50"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

