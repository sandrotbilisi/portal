"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { COMPANY_NAME, COMPANY_LOGO } from "@/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  axios.defaults.withCredentials = true;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
      const role = res.data?.data?.role;
      // Clear localStorage on login to prevent carryover
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedCompanyId');
      }
      if (role === 'systemAdmin' || role === 'admin') {
        // Redirect systemAdmin and admins to admin dashboard
        router.replace('/admin');
      } else if (role === 'user') {
        // Redirect regular users to user dashboard
        router.replace('/user');
      } else {
        router.replace('/unauthorized');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6">
      <div className="w-full max-w-md">
        {/* Company Branding Section */}
        {(COMPANY_LOGO || COMPANY_NAME) && (
          <div className="mb-8 text-center">
            {COMPANY_LOGO && (
              <img 
                src={COMPANY_LOGO} 
                alt={COMPANY_NAME || 'Company Logo'} 
                className="mx-auto mb-4 max-w-[200px] max-h-[100px] object-contain"
              />
            )}
            {COMPANY_NAME && (
              <h2 className="text-3xl font-bold text-white">{COMPANY_NAME}</h2>
            )}
          </div>
        )}

        <div className="w-full max-w-md bg-gray-800/60 border border-gray-700/40 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold text-white mb-6 text-center">Login</h1>
        {error && (
          <div className="mb-4 text-red-300 bg-red-900/30 border border-red-700/40 rounded-lg p-3">{error}</div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="admin"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
} 