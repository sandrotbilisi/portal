'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Permission, Branch } from '../../types';

const API_BASE_URL = "https://home-server.tail7b1d07.ts.net";

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderPath: string;
  folderName: string;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  folderPath,
  folderName
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [permission, setPermission] = useState<Permission | null>(null);
  
  // Role restrictions state
  const [userRoleRestrictions, setUserRoleRestrictions] = useState({
    view: true,
    upload: true,
    delete: true,
    rename: true
  });
  
  // Branch restrictions state (map of branchId to restrictions)
  const [branchRestrictions, setBranchRestrictions] = useState<{ [branchId: string]: any }>({});
  
  // UI state for branch management
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [expandedBranches, setExpandedBranches] = useState(true);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
      fetchPermission();
    }
  }, [isOpen, folderPath]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches`);
      if (response.data.success) {
        setBranches(response.data.data);
        // Initialize branch restrictions for all branches
        const initialBranchRestrictions: any = {};
        response.data.data.forEach((branch: Branch) => {
          initialBranchRestrictions[branch.id] = {
            view: true,
            upload: true,
            delete: true,
            rename: true
          };
        });
        setBranchRestrictions(initialBranchRestrictions);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchPermission = async () => {
    try {
      setLoading(true);
      // For root directory (empty path), fetch using special identifier
      const url = folderPath 
        ? `${API_BASE_URL}/permissions/${encodeURIComponent(folderPath)}`
        : `${API_BASE_URL}/permissions/__root__`;
      const response = await axios.get(url);
      
      if (response.data.success && response.data.data) {
        const perm = response.data.data;
        setPermission(perm);
        
        // Load existing role restrictions
        if (perm.roleRestrictions?.user) {
          setUserRoleRestrictions({
            view: perm.roleRestrictions.user.view !== false,
            upload: perm.roleRestrictions.user.upload !== false,
            delete: perm.roleRestrictions.user.delete !== false,
            rename: perm.roleRestrictions.user.rename !== false
          });
        }
        
        // Load existing branch restrictions
        if (perm.branchRestrictions) {
          setBranchRestrictions((prev) => {
            const updated = { ...prev };
            Object.keys(perm.branchRestrictions).forEach(branchId => {
              updated[branchId] = {
                view: perm.branchRestrictions[branchId].view !== false,
                upload: perm.branchRestrictions[branchId].upload !== false,
                delete: perm.branchRestrictions[branchId].delete !== false,
                rename: perm.branchRestrictions[branchId].rename !== false
              };
            });
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch permission:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Build role restrictions
      const roleRestrictions: any = {
        user: {
          view: userRoleRestrictions.view,
          upload: userRoleRestrictions.upload,
          delete: userRoleRestrictions.delete,
          rename: userRoleRestrictions.rename
        }
      };

      // Build branch restrictions (only include branches with restrictions)
      const filteredBranchRestrictions: any = {};
      Object.keys(branchRestrictions).forEach(branchId => {
        const restrictions = branchRestrictions[branchId];
        // Only add if at least one permission is disabled
        if (!restrictions.view || !restrictions.upload || !restrictions.delete || !restrictions.rename) {
          filteredBranchRestrictions[branchId] = restrictions;
        }
      });

      // Use empty string for root directory in the database
      const response = await axios.post(`${API_BASE_URL}/permissions`, {
        folderPath: folderPath || '',
        roleRestrictions,
        branchRestrictions: filteredBranchRestrictions
      });

      if (response.data.success) {
        setSuccess('Permissions saved successfully!');
        setLoading(false);
        // Small delay to show success message, then close
        await new Promise(resolve => setTimeout(resolve, 800));
        onClose();
      } else {
        setError(response.data.message || 'Failed to save permissions');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use __root__ identifier for root directory in URL
      const pathToDelete = folderPath ? encodeURIComponent(folderPath) : '__root__';
      const response = await axios.delete(`${API_BASE_URL}/permissions/${pathToDelete}`);

      if (response.data.success) {
        onClose();
      } else {
        setError(response.data.message || 'Failed to delete permissions');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete permissions');
    } finally {
      setLoading(false);
    }
  };

  // Quick preset functions
  const applyPresetToRole = (preset: 'full' | 'readonly' | 'none') => {
    switch (preset) {
      case 'full':
        setUserRoleRestrictions({ view: true, upload: true, delete: true, rename: true });
        break;
      case 'readonly':
        setUserRoleRestrictions({ view: true, upload: false, delete: false, rename: false });
        break;
      case 'none':
        setUserRoleRestrictions({ view: false, upload: false, delete: false, rename: false });
        break;
    }
  };

  const applyPresetToBranches = (preset: 'full' | 'readonly' | 'none', branchIds: string[]) => {
    const newRestrictions = { ...branchRestrictions };
    branchIds.forEach(branchId => {
      switch (preset) {
        case 'full':
          newRestrictions[branchId] = { view: true, upload: true, delete: true, rename: true };
          break;
        case 'readonly':
          newRestrictions[branchId] = { view: true, upload: false, delete: false, rename: false };
          break;
        case 'none':
          newRestrictions[branchId] = { view: false, upload: false, delete: false, rename: false };
          break;
      }
    });
    setBranchRestrictions(newRestrictions);
  };

  const toggleAllBranches = () => {
    if (selectedBranches.length === branches.length) {
      setSelectedBranches([]);
    } else {
      setSelectedBranches(branches.map(b => b.id));
    }
  };

  const toggleBranchSelection = (branchId: string) => {
    setSelectedBranches(prev => 
      prev.includes(branchId) 
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-gray-800/90 backdrop-blur-xl border border-gray-600/30 rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-full transition-colors duration-200"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-white">
              {folderPath === '' ? 'Root Directory Permissions' : 'Folder Permissions'}
            </h2>
          </div>
          <p className="text-gray-400 ml-11">
            {folderPath === '' ? (
              <>Manage default access permissions for the root directory and all unrestricted folders</>
            ) : (
              <>Manage access permissions for: <span className="text-white font-medium">{folderName}</span></>
            )}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-900/30 border border-green-700/50 text-green-200 px-4 py-3 rounded-xl flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        {loading && !error && !success ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading permissions...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Role-based Permissions */}
            <div className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    User Role Permissions
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">Control what users (non-admins) can do</p>
                </div>
                
                {/* Quick Presets */}
                <div className="flex gap-2">
                  <button
                    onClick={() => applyPresetToRole('full')}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-colors"
                    title="Full Access"
                  >
                    Full Access
                  </button>
                  <button
                    onClick={() => applyPresetToRole('readonly')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                    title="Read Only"
                  >
                    Read Only
                  </button>
                  <button
                    onClick={() => applyPresetToRole('none')}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors"
                    title="No Access"
                  >
                    No Access
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['view', 'upload', 'delete', 'rename'].map((action) => (
                  <label key={action} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userRoleRestrictions[action as keyof typeof userRoleRestrictions]}
                      onChange={(e) => setUserRoleRestrictions(prev => ({
                        ...prev,
                        [action]: e.target.checked
                      }))}
                      className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 bg-gray-700"
                    />
                    <span className="text-white capitalize">{action}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Branch-based Permissions */}
            <div className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpandedBranches(!expandedBranches)}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    <svg className={`w-5 h-5 transition-transform ${expandedBranches ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Branch Permissions
                      {selectedBranches.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-600 text-xs rounded-full">
                          {selectedBranches.length} selected
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">Control what each branch can do</p>
                  </div>
                </div>
              </div>

              {branches.length === 0 ? (
                <p className="text-gray-500 italic">No branches available</p>
              ) : (
                <>
                  {/* Bulk Actions Bar */}
                  <div className="mb-4 p-4 bg-gray-800/50 border border-gray-600/20 rounded-lg">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBranches.length === branches.length && branches.length > 0}
                          onChange={toggleAllBranches}
                          className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 bg-gray-700"
                        />
                        <span className="text-white text-sm font-medium">Select All ({branches.length})</span>
                      </label>
                      
                      <div className="flex-1"></div>
                      
                      {selectedBranches.length > 0 && (
                        <>
                          <span className="text-gray-400 text-sm">Apply to selected:</span>
                          <button
                            onClick={() => applyPresetToBranches('full', selectedBranches)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-colors"
                          >
                            Full Access
                          </button>
                          <button
                            onClick={() => applyPresetToBranches('readonly', selectedBranches)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                          >
                            Read Only
                          </button>
                          <button
                            onClick={() => applyPresetToBranches('none', selectedBranches)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors"
                          >
                            No Access
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Branch List */}
                  {expandedBranches && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {branches.map((branch) => (
                        <div key={branch.id} className="bg-gray-800/50 border border-gray-600/20 rounded-lg p-4 hover:border-gray-500/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedBranches.includes(branch.id)}
                              onChange={() => toggleBranchSelection(branch.id)}
                              className="mt-1 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 bg-gray-700"
                            />
                            <div className="flex-1">
                              <h4 className="text-white font-medium mb-2">
                                {branch.name} <span className="text-gray-400 text-sm font-normal">({branch.location})</span>
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['view', 'upload', 'delete', 'rename'].map((action) => (
                                  <label key={action} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={branchRestrictions[branch.id]?.[action] !== false}
                                      onChange={(e) => setBranchRestrictions(prev => ({
                                        ...prev,
                                        [branch.id]: {
                                          ...prev[branch.id],
                                          [action]: e.target.checked
                                        }
                                      }))}
                                      className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 bg-gray-700"
                                    />
                                    <span className="text-gray-300 capitalize text-sm">{action}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              {permission && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove All Permissions
                </button>
              )}
              <div className="flex-1"></div>
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !!success}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : success ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Permissions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

