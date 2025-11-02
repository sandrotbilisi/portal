"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Company } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  axios.defaults.withCredentials = true;

  const fetchUserRole = async () => {
    try {
      const me = await axios.get(`${API_BASE_URL}/auth/me`);
      if (!me.data?.data) return router.replace('/login');
      const role = me.data.data.role;
      setUserRole(role);
      if (role !== 'systemAdmin') {
        return router.replace('/unauthorized');
      }
    } catch (err) {
      router.replace('/login');
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const me = await axios.get(`${API_BASE_URL}/auth/me`);
      if (!me.data?.data) return router.replace('/login');
      if (me.data.data.role !== 'systemAdmin') return router.replace('/unauthorized');
      const res = await axios.get(`${API_BASE_URL}/companies`);
      setCompanies(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
    fetchCompanies();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const preview = URL.createObjectURL(file);
      setLogoPreview(preview);
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await axios.post(`${API_BASE_URL}/companies/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.logoUrl || response.data.data.logo || '';
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name.trim() || !identificationNumber.trim()) {
      setError('Name and Identification Number are required');
      return;
    }

    setCreating(true);
    try {
      let logoUrl = logo;
      
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      await axios.post(`${API_BASE_URL}/companies`, {
        name: name.trim(),
        identificationNumber: identificationNumber.trim(),
        logo: logoUrl
      });
      
      setName("");
      setIdentificationNumber("");
      setLogo("");
      setLogoFile(null);
      setLogoPreview(null);
      await fetchCompanies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const handleEditCompany = async () => {
    if (!editId) return;
    setError(null);

    if (!name.trim() || !identificationNumber.trim()) {
      setError('Name and Identification Number are required');
      return;
    }

    setEditing(true);
    try {
      let logoUrl = logo;
      
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      await axios.put(`${API_BASE_URL}/companies/${editId}`, {
        name: name.trim(),
        identificationNumber: identificationNumber.trim(),
        logo: logoUrl
      });
      
      setIsEditModalOpen(false);
      setEditId(null);
      setName("");
      setIdentificationNumber("");
      setLogo("");
      setLogoFile(null);
      setLogoPreview(null);
      await fetchCompanies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update company');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE_URL}/companies/${deleteId}`);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      await fetchCompanies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete company');
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const openEditModal = (company: Company) => {
    setEditId(company.id);
    setName(company.name);
    setIdentificationNumber(company.identificationNumber);
    setLogo(company.logo);
    setLogoFile(null);
    setLogoPreview(company.logo || null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditId(null);
    setName("");
    setIdentificationNumber("");
    setLogo("");
    setLogoFile(null);
    setLogoPreview(null);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      router.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (userRole !== 'systemAdmin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Companies</h1>
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
          <h2 className="text-white font-medium mb-4">Create Company</h2>
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Company Name *</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="Acme Corporation" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Identification Number *</label>
                <input 
                  value={identificationNumber} 
                  onChange={(e) => setIdentificationNumber(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="123456789" 
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Company Logo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white text-sm"
              />
              {logoPreview && (
                <div className="mt-3">
                  <img src={logoPreview} alt="Logo preview" className="w-32 h-32 object-contain border border-gray-600/30 rounded-lg" />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={creating} 
              className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition-colors duration-200 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Company'}
            </button>
          </form>
        </div>

        <div className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-6">
          <h2 className="text-white font-medium mb-4">Existing Companies</h2>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : companies.length === 0 ? (
            <div className="text-gray-400">No companies</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map(company => (
                <div key={company.id} className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-5 hover:bg-gray-700/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          {company.logo ? (
                            <img src={company.logo} alt={company.name} className="w-10 h-10 object-contain rounded-lg" />
                          ) : (
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                          <p className="text-sm text-gray-400">ID: {company.identificationNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Created: {formatDate(company.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(company)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors duration-200"
                        title="Edit Company"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(company.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
                        title="Delete Company"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Company Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Edit Company</h2>
              <p className="text-gray-400">Update company information</p>
            </div>

            {error && (
              <div className="mb-4 text-red-300 bg-red-900/30 border border-red-700/40 rounded-lg p-3">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Company Name *</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="Acme Corporation" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Identification Number *</label>
                <input 
                  value={identificationNumber} 
                  onChange={(e) => setIdentificationNumber(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white" 
                  placeholder="123456789" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Company Logo (Optional)</label>
                {logoPreview && !logoFile && (
                  <div className="mb-3">
                    <img src={logoPreview} alt="Current logo" className="w-32 h-32 object-contain border border-gray-600/30 rounded-lg" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white text-sm"
                />
                {logoFile && logoPreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-400 mb-2">New logo preview:</p>
                    <img src={logoPreview} alt="New logo preview" className="w-32 h-32 object-contain border border-gray-600/30 rounded-lg" />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCompany}
                  disabled={editing}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition-colors duration-200 disabled:opacity-50"
                >
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Delete Company</h2>
              <p className="text-gray-400">Are you sure you want to delete this company?</p>
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
                onClick={handleDeleteCompany}
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




