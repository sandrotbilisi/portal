"use client";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = "https://home-server.tail7b1d07.ts.net";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
    } catch {}
    router.replace('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6">
      <div className="w-full max-w-md bg-gray-800/60 border border-gray-700/40 rounded-2xl p-8 text-center shadow-2xl">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-semibold text-white mb-2">Access restricted</h1>
        <p className="text-gray-400 mb-6">This admin panel is only accessible to admin users.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.replace('/login')} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-xl">Login</button>
          <button onClick={handleLogout} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl">Logout</button>
        </div>
      </div>
    </div>
  );
} 