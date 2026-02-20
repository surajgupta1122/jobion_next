"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, User, Menu, X } from 'lucide-react';
import api from '../../../components/apiconfig/apiconfig';

export default function CandidateHeader() {
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/session');
      if (response.data?.user) {
        setUserData(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const getUserInitial = () => {
    if (userData?.full_name) {
      return userData.full_name.charAt(0).toUpperCase();
    }
    return userData?.username?.charAt(0).toUpperCase() || 'U';
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatCreatedDate = (u) => {
    if (!u) return '-';
    const d = u.created_at || u.createdAt || u.created || u.createdAtDate || u.createdAtUTC;
    try {
      const date = d ? new Date(d) : null;
      return date ? date.toLocaleDateString() : '-';
    } catch (e) {
      return '-';
    }
  };

  const formatLoginTime = (u) => {
    if (!u) return '-';
    const d = u.loginAt || u.last_login || u.lastLogin || u.loggedInAt;
    try {
      const date = d ? new Date(d) : null;
      return date ? date.toLocaleString() : '-';
    } catch (e) {
      return '-';
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Find Jobs' },
    { path: '/dashboard/saved', label: 'Saved Jobs' },
    { path: '/dashboard/applied', label: 'Applications' },
    { path: '/dashboard/profile', label: 'Profile' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-primary-200/50 bg-white/90 backdrop-blur-xl text-text-dark shadow-energy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 sm:gap-3 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <b className="text-xl sm:text-2xl font-black tracking-widest bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent drop-shadow-sm hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 transition-all duration-300">
              Job<span className="relative">
                <span className="text-red-800 font-serif text-xl sm:text-2xl">i</span>
              </span>on
            </b>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-colors inline-flex items-center gap-1.5 ${
                  isActive(item.path)
                    ? "bg-gradient-red text-white shadow-energy"
                    : "text-text-muted hover:bg-gradient-red hover:text-white hover:shadow-kinetic"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-secondary-600 to-secondary-700 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
                  {userData ? getUserInitial() : <User size={18} />}
                </div>
              </button>

              {dropdownOpen && userData && (
                <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 z-50 transform transition-all duration-200 ease-out opacity-100 translate-y-0">
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Name</div>
                        <div className="font-semibold text-gray-900 text-base">
                          {userData.name || userData.full_name || userData.fullname || userData.username || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Username</div>
                        <div className="text-sm text-gray-700 font-medium">{userData.username || userData.email || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Role</div>
                        <div className="text-sm">
                          <span className="inline-flex px-2.5 py-1 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-md text-xs font-semibold border border-primary-200">
                            {userData.role || 'candidate'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Member since</div>
                        <div className="text-sm text-gray-700 font-medium">{formatCreatedDate(userData)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Last login</div>
                        <div className="text-sm text-gray-700 font-medium">{formatLoginTime(userData)}</div>
                      </div>
                    </div>
                    
                    <div className="pt-5 mt-5 border-t border-gray-200 space-y-2.5">
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block w-full text-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 hover:from-primary-100 hover:to-primary-200 transition-all duration-200 font-semibold text-sm border border-primary-200 shadow-sm hover:shadow-md"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold text-sm text-white shadow-sm hover:shadow-md"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
