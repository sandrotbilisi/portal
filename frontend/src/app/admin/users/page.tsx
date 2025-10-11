"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_BASE_URL = "https://home-server.tail7b1d07.ts.net";

interface UserRow { id: string; username: string; role: "admin" | "user"; }

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [creating, setCreating] = useState(false);

  axios.defaults.withCredentials = true;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const me = await axios.get(`${API_BASE_URL}/auth/me`);
      if (!me.data?.data) return router.replace('/login');
      if (me.data.data.role !== 'admin') return router.replace('/unauthorized');
      const res = await axios.get(`${API_BASE_URL}/users`);
      setUsers(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await axios.post(`${API_BASE_URL}/users`, { username, password, role });
      setUsername("");
      setPassword("");
      setRole("user");
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Users</h1>
          <div className="flex items-center gap-3">
            {/* Inbox Button */}
            <button
              onClick={() => router.push('/admin/inbox')}
              className="relative p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              title="Inbox"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </button>
            
            {/* Profile Button */}
            <button
              onClick={() => router.push('/admin/profile')}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              title="Profile"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            
            <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200">Back</button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-300 bg-red-900/30 border border-red-700/40 rounded-lg p-3">{error}</div>
        )}

        <div className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-medium mb-4">Create user</h2>
          <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" placeholder="username" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" placeholder="password" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={creating} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-xl">{creating ? 'Creating...' : 'Create'}</button>
          </form>
        </div>

        <div className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-6">
          <h2 className="text-white font-medium mb-4">Existing users</h2>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-gray-400">No users</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-gray-300">
                <thead>
                  <tr className="text-gray-400">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Username</th>
                    <th className="py-2 pr-4">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-gray-700/40">
                      <td className="py-2 pr-4">{u.id}</td>
                      <td className="py-2 pr-4">{u.username}</td>
                      <td className="py-2 pr-4">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 