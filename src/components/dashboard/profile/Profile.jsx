"use client";
import { useState, useEffect, useRef } from "react";
import { 
  MdClose,
  MdPerson,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdEdit,
  MdLock,
  MdBusiness,
  MdBadge
} from "react-icons/md";

const API_BASE = "https://saloon.mrshakil.com/api";

// Helper for authenticated requests
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
            ...options.headers,
        },
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
    }
    
    return response.json();
}

export default function Profile({ isOpen, onClose, onUserDataUpdate }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [passwordError, setPasswordError] = useState(null);
  const modalRef = useRef(null);

  // Fetch user profile when modal opens
  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch('/user/profile/');
      
      if (result.success) {
        setUserData(result.data);
        onUserDataUpdate?.(result.data);
        setEditFormData({
          first_name: result.data.first_name || "",
          last_name: result.data.last_name || "",
          email: result.data.email || "",
          phone: result.data.phone || "",
          address: result.data.address || ""
        });
      } else {
        setError(result.message || "Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Unable to load profile. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await apiFetch('/user/profile/update/', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          address: editFormData.address
        })
      });
      
      if (result.success) {
        setUserData(result.data);
        onUserDataUpdate?.(result.data);
        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Unable to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setError(null);
    setSuccessMessage(null);
    
    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    // Validate password length
    if (passwordData.new_password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await apiFetch('/user/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password
        })
      });
      
      if (result.success) {
        setShowChangePassword(false);
        setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
        setSuccessMessage("Password changed successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError("Unable to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      fetchUserProfile();
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    setIsEditing(false);
    setShowChangePassword(false);
    setError(null);
    setSuccessMessage(null);
    setPasswordError(null);
  };

  if (!isOpen) return null;

  // Get user role from localStorage
  const userRole = localStorage.getItem("role") || "customer";

  return (
    <div className="fixed inset-0 bg-black/70 text-white backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-gradient-to-br from-gray-900 to-black rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#dba627]/30 shadow-2xl"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-[#dba627]/20 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MdPerson className="text-[#dba627]" />
            My Profile
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <MdClose size={24} className="text-offwhite/60 hover:text-white" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
              {successMessage}
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {loading && !userData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dba627]"></div>
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#dba627]/20">
                <div className="relative">
                  <img
                    src={userData?.avatar || `https://ui-avatars.com/api/?name=${userData?.first_name || 'User'}+${userData?.last_name || ''}&background=dba627&color=fff&bold=true`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#dba627]"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {userData?.first_name} {userData?.last_name}
                  </h3>
                  <p className="text-[#dba627] text-sm capitalize">{userRole}</p>
                  <p className="text-xs text-offwhite/40">ID: {userData?.id}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-[#dba627]/20 overflow-x-auto">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setShowChangePassword(false);
                    setError(null);
                  }}
                  className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                    !isEditing && !showChangePassword
                      ? "text-[#dba627] border-b-2 border-[#dba627]"
                      : "text-offwhite/60 hover:text-white"
                  }`}
                >
                  Profile Info
                </button>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowChangePassword(false);
                    setError(null);
                  }}
                  className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                    isEditing && !showChangePassword
                      ? "text-[#dba627] border-b-2 border-[#dba627]"
                      : "text-offwhite/60 hover:text-white"
                  }`}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(true);
                    setIsEditing(false);
                    setError(null);
                    setPasswordError(null);
                  }}
                  className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                    showChangePassword
                      ? "text-[#dba627] border-b-2 border-[#dba627]"
                      : "text-offwhite/60 hover:text-white"
                  }`}
                >
                  Change Password
                </button>
              </div>

              {/* Profile Info View */}
              {!isEditing && !showChangePassword && userData && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <MdPerson className="text-[#dba627] mt-1 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <p className="text-xs text-offwhite/50 uppercase">Full Name</p>
                      <p className="text-white font-medium break-words">
                        {userData.first_name} {userData.last_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <MdEmail className="text-[#dba627] mt-1 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <p className="text-xs text-offwhite/50 uppercase">Email</p>
                      <p className="text-white font-medium break-words">
                        {userData.email || "Not provided"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <MdPhone className="text-[#dba627] mt-1 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <p className="text-xs text-offwhite/50 uppercase">Phone</p>
                      <p className="text-white font-medium">{userData.phone || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <MdLocationOn className="text-[#dba627] mt-1 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <p className="text-xs text-offwhite/50 uppercase">Address</p>
                      <p className="text-white font-medium break-words">
                        {userData.address || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Manager Specific Info */}
                  {userRole === "manager" && (
                    <>
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <MdBusiness className="text-[#dba627] mt-1 flex-shrink-0" size={20} />
                        <div className="flex-1">
                          <p className="text-xs text-offwhite/50 uppercase">Managed Branch</p>
                          <p className="text-white font-medium break-words">
                            {userData.managed_branch_name || "Not assigned"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <MdBadge className="text-[#dba627] mt-1 flex-shrink-0" size={20} />
                        <div className="flex-1">
                          <p className="text-xs text-offwhite/50 uppercase">Staff ID</p>
                          <p className="text-white font-medium break-words">
                            {userData.staff_id || "Not assigned"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Edit Profile Form */}
              {isEditing && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-offwhite/70 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.first_name}
                      onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-[#dba627]/20 rounded-lg text-white focus:outline-none focus:border-[#dba627] transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-offwhite/70 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.last_name}
                      onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-[#dba627]/20 rounded-lg text-white focus:outline-none focus:border-[#dba627] transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-offwhite/70 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-offwhite/40 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-offwhite/70 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-offwhite/40 mt-1">Phone number cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-offwhite/70 mb-2">
                      Address
                    </label>
                    <textarea
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-[#dba627]/20 rounded-lg text-white focus:outline-none focus:border-[#dba627] transition-colors"
                      rows="3"
                      placeholder="Your address"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-[#dba627] text-black font-medium rounded-lg hover:bg-[#dba627]/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Change Password Form */}
              {showChangePassword && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                      {passwordError}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-offwhite/70 mb-2">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.old_password}
                      onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-[#dba627]/20 rounded-lg text-white focus:outline-none focus:border-[#dba627] transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-offwhite/70 mb-2">
                      New Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-[#dba627]/20 rounded-lg text-white focus:outline-none focus:border-[#dba627] transition-colors"
                      required
                    />
                    <p className="text-xs text-offwhite/40 mt-1">Minimum 6 characters</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-offwhite/70 mb-2">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                      className="w-full px-4 py-2 bg-white/5 border border-[#dba627]/20 rounded-lg text-white focus:outline-none focus:border-[#dba627] transition-colors"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-[#dba627] text-black font-medium rounded-lg hover:bg-[#dba627]/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? "Changing..." : "Change Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setPasswordError(null);
                      }}
                      className="flex-1 px-4 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}