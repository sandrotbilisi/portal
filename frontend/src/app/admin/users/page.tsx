"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { User, Branch } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  
  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editName, setEditName] = useState("");
  const [editLastname, setEditLastname] = useState("");
  const [editPersonalNumber, setEditPersonalNumber] = useState("");
  const [editBranchIds, setEditBranchIds] = useState<string[]>([]);
  const [editRole, setEditRole] = useState<"user" | "admin">("user");
  const [updating, setUpdating] = useState(false);

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

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branches`);
      const branchesData = res.data.data || [];
      setBranches(branchesData);
    } catch (err: any) {
      console.error('Failed to load branches:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (branchIds.length === 0) {
      setError('Please select at least one branch');
      return;
    }
    
    setCreating(true);
    try {
      await axios.post(`${API_BASE_URL}/users`, { 
        username, 
        password, 
        role,
        name,
        lastname,
        personalNumber,
        branchIds
      });
      setUsername("");
      setPassword("");
      setRole("user");
      setName("");
      setLastname("");
      setPersonalNumber("");
      setBranchIds([]);
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditName(user.name);
    setEditLastname(user.lastname);
    setEditPersonalNumber(user.personalNumber);
    setEditBranchIds(user.branchIds || []);
    setEditRole(user.role);
    setIsEditModalOpen(true);
    setError(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditUsername("");
    setEditName("");
    setEditLastname("");
    setEditPersonalNumber("");
    setEditBranchIds([]);
    setEditRole("user");
    setError(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    if (editBranchIds.length === 0) {
      setError('Please select at least one branch');
      return;
    }
    
    setError(null);
    setUpdating(true);
    try {
      await axios.put(`${API_BASE_URL}/users/${editingUser.id}`, {
        username: editUsername,
        role: editRole,
        name: editName,
        lastname: editLastname,
        personalNumber: editPersonalNumber,
        branchIds: editBranchIds
      });
      closeEditModal();
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
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

        {branches.length === 0 && (
          <div className="mb-4 text-yellow-300 bg-yellow-900/30 border border-yellow-700/40 rounded-lg p-4 flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">No branches available</p>
              <p className="text-sm">Please create a branch first before adding users.</p>
            </div>
            <button 
              onClick={() => router.push('/admin/branches')}
              className="ml-auto px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors duration-200"
            >
              Go to Branches
            </button>
          </div>
        )}

        <div className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-medium mb-4">Create user</h2>
          <form onSubmit={createUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">First Name *</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="John" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Last Name *</label>
                <input 
                  value={lastname} 
                  onChange={(e) => setLastname(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="Doe" 
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Username *</label>
                <input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="johndoe" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Personal Number *</label>
                <input 
                  value={personalNumber} 
                  onChange={(e) => setPersonalNumber(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="123456-7890" 
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Password *</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="••••••••" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Role *</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as any)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Branches * (select multiple)</label>
                <div className="bg-gray-700/50 border border-gray-600/30 rounded-xl p-3 max-h-40 overflow-y-auto">
                  {branches.length === 0 ? (
                    <p className="text-gray-400 text-sm">No branches available</p>
                  ) : (
                    branches.map(branch => (
                      <label key={branch.id} className="flex items-center space-x-3 py-2 hover:bg-gray-600/30 rounded px-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={branchIds.includes(branch.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBranchIds([...branchIds, branch.id]);
                            } else {
                              setBranchIds(branchIds.filter(id => id !== branch.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                        />
                        <span className="text-white text-sm">{branch.name} - {branch.location}</span>
                      </label>
                    ))
                  )}
                </div>
                {branchIds.length > 0 && (
                  <p className="text-sm text-gray-400 mt-2">{branchIds.length} branch(es) selected</p>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={creating || branches.length === 0} 
              className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : branches.length === 0 ? 'Create a branch first' : 'Create User'}
            </button>
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
                  <tr className="text-gray-400 border-b border-gray-700/40">
                    <th className="py-3 pr-4">ID</th>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Last Name</th>
                    <th className="py-3 pr-4">Username</th>
                    <th className="py-3 pr-4">Personal Number</th>
                    <th className="py-3 pr-4">Branches</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-gray-700/40 hover:bg-gray-700/20 transition-colors">
                      <td className="py-3 pr-4">{u.id}</td>
                      <td className="py-3 pr-4">{u.name || '-'}</td>
                      <td className="py-3 pr-4">{u.lastname || '-'}</td>
                      <td className="py-3 pr-4">{u.username}</td>
                      <td className="py-3 pr-4">{u.personalNumber || '-'}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {u.branches && u.branches.length > 0 ? (
                            u.branches.map(branch => (
                              <span key={branch.id} className="px-2 py-1 bg-gray-600/40 text-gray-200 rounded text-xs">
                                {branch.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          u.role === 'admin' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors duration-200"
                          title="Edit User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit User</h2>
              <button
                onClick={closeEditModal}
                className="p-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-full transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 text-red-300 bg-red-900/30 border border-red-700/40 rounded-lg p-3">{error}</div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">First Name *</label>
                  <input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Last Name *</label>
                  <input 
                    value={editLastname} 
                    onChange={(e) => setEditLastname(e.target.value)} 
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Username *</label>
                  <input 
                    value={editUsername} 
                    onChange={(e) => setEditUsername(e.target.value)} 
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Personal Number *</label>
                  <input 
                    value={editPersonalNumber} 
                    onChange={(e) => setEditPersonalNumber(e.target.value)} 
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Role *</label>
                <select 
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value as any)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Branches * (select multiple)</label>
                <div className="bg-gray-700/50 border border-gray-600/30 rounded-xl p-3 max-h-40 overflow-y-auto">
                  {branches.length === 0 ? (
                    <p className="text-gray-400 text-sm">No branches available</p>
                  ) : (
                    branches.map(branch => (
                      <label key={branch.id} className="flex items-center space-x-3 py-2 hover:bg-gray-600/30 rounded px-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editBranchIds.includes(branch.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditBranchIds([...editBranchIds, branch.id]);
                            } else {
                              setEditBranchIds(editBranchIds.filter(id => id !== branch.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                        />
                        <span className="text-white text-sm">{branch.name} - {branch.location}</span>
                      </label>
                    ))
                  )}
                </div>
                {editBranchIds.length > 0 && (
                  <p className="text-sm text-gray-400 mt-2">{editBranchIds.length} branch(es) selected</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Update User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 