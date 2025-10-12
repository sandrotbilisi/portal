"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Branch {
  id: string;
  name: string;
  location: string;
}

export default function BranchesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  axios.defaults.withCredentials = true;

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const me = await axios.get(`${API_BASE_URL}/auth/me`);
      if (!me.data?.data) return router.replace('/login');
      if (me.data.data.role !== 'admin') return router.replace('/unauthorized');
      const res = await axios.get(`${API_BASE_URL}/branches`);
      setBranches(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await axios.post(`${API_BASE_URL}/branches`, { name, location });
      setName("");
      setLocation("");
      await fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE_URL}/branches/${deleteId}`);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      await fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete branch');
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      router.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Branches</h1>
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
          <h2 className="text-white font-medium mb-4">Create Branch</h2>
          <form onSubmit={createBranch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Branch Name *</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="Downtown Branch" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Location *</label>
                <input 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="123 Main St, City" 
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={creating} 
              className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition-colors duration-200 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Branch'}
            </button>
          </form>
        </div>

        <div className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-6">
          <h2 className="text-white font-medium mb-4">Existing Branches</h2>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : branches.length === 0 ? (
            <div className="text-gray-400">No branches</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map(branch => (
                <div key={branch.id} className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-5 hover:bg-gray-700/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{branch.name}</h3>
                          <p className="text-sm text-gray-400">{branch.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>ID: {branch.id}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDeleteId(branch.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
                      title="Delete Branch"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Delete Branch</h2>
              <p className="text-gray-400">Are you sure you want to delete this branch?</p>
            </div>

            {error && (
              <div className="mb-4 text-red-300 bg-red-900/30 border border-red-700/40 rounded-lg p-3">{error}</div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteId(null);
                  setError(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


