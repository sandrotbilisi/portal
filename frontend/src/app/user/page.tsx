"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = "https://home-server.tail7b1d07.ts.net";

interface MeResponse {
  username: string;
  role: "admin" | "user";
}

export default function UserDashboard() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const getMe = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`);
        if (res.data?.data) {
          setMe(res.data.data);
        }
      } catch (err) {
        console.error('Failed to get user info:', err);
      } finally {
        setLoading(false);
      }
    };
    getMe();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      router.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-700 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-300 to-slate-300 bg-clip-text text-transparent">
                  Exmony
                </h1>
                <p className="text-gray-500 text-sm font-medium">User Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Inbox Button */}
              <button
                onClick={() => router.push('/user/inbox')}
                className="relative p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                title="Inbox"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">2</span>
              </button>
              
              {/* Profile Button */}
              <button
                onClick={() => router.push('/user/profile')}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                title="Profile"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-gray-400 text-lg">Loading...</p>
          ) : (
            <p className="text-gray-400 text-lg">
              Welcome, <span className="text-white font-medium">{me?.username}</span>!
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Profile</h3>
                <p className="text-gray-400 text-sm">Your account information</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Username:</span>
                <span className="text-white font-medium">{me?.username || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Role:</span>
                <span className="text-white font-medium capitalize">{me?.role || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Activity</h3>
                <p className="text-gray-400 text-sm">Recent actions</p>
              </div>
            </div>
            <p className="text-gray-400">No recent activity</p>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
                <p className="text-gray-400 text-sm">Common tasks</p>
              </div>
            </div>
            <p className="text-gray-400">No actions available</p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to Your Dashboard</h2>
          <p className="text-gray-400 mb-4">
            This is your personal dashboard where you can access your account information and perform various tasks.
          </p>
          <p className="text-gray-400">
            As a {me?.role === 'admin' ? 'administrator' : 'user'}, you have access to specific features tailored to your role.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-700/30">
          <div className="flex flex-col sm:flex-row items-center justify-between text-gray-500 text-sm">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-gray-600 to-gray-800 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">E</span>
              </div>
              <span>Powered by <span className="text-gray-400 font-medium">Exmony</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <span>User Portal</span>
              <span>•</span>
              <span>Secure & Reliable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

