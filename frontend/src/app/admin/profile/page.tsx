"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = "https://home-server.tail7b1d07.ts.net";

interface MeResponse {
  username: string;
  role: "admin" | "user";
  name: string;
  lastname: string;
  personalNumber: string;
  branchId: string;
  branchName: string;
  branchLocation: string;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handlePasswordChange = async () => {
    setError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // TODO: Implement password change API call
    setSuccess('Password changed successfully!');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-700 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Admin Profile</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/inbox')}
                className="relative p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                title="Inbox"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block relative">
              <div className="w-16 h-16 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-300 text-lg">Loading...</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Profile Info Card */}
            <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{me?.name} {me?.lastname}</h2>
                  <p className="text-gray-400 capitalize">{me?.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-700/30">
                  <span className="text-gray-400">Full Name</span>
                  <span className="text-white font-medium">{me?.name} {me?.lastname}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-700/30">
                  <span className="text-gray-400">Personal Number</span>
                  <span className="text-white font-medium">{me?.personalNumber}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-700/30">
                  <span className="text-gray-400">Username</span>
                  <span className="text-white font-medium">{me?.username}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-700/30">
                  <span className="text-gray-400">Branch</span>
                  <span className="text-white font-medium">{me?.branchName} - {me?.branchLocation}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-700/30">
                  <span className="text-gray-400">Role</span>
                  <span className="text-white font-medium capitalize">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                      {me?.role}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Account Type</span>
                  <span className="text-white font-medium">Administrator</span>
                </div>
              </div>
            </div>

            {/* Password Change Card */}
            <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Security</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-900/30 border border-green-700/50 text-green-200 px-4 py-3 rounded-xl">
                      {success}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setNewPassword('');
                        setConfirmPassword('');
                        setError(null);
                      }}
                      className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePasswordChange}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Keep your account secure by regularly updating your password.</p>
              )}
            </div>

            {/* Account Statistics */}
            <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-600/20 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Account Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">∞</div>
                  <div className="text-sm text-gray-400">Storage Used</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">∞</div>
                  <div className="text-sm text-gray-400">Files Managed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">Admin</div>
                  <div className="text-sm text-gray-400">Access Level</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

