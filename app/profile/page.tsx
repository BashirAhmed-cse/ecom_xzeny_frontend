// app/profile/page.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '@/lib/api';
import { useTheme } from '@/lib/ThemeProvider';
import {
  User, Mail, MapPin, Home, Plus, Edit2, Trash2, Check, X,
  Phone, CreditCard, Truck, Camera, Save, Loader2
} from 'lucide-react';

interface Address { 
  address_id: number; 
  user_id: number; 
  street: string; 
  city: string; 
  state: string; 
  country: string; 
  postal_code: string; 
  is_billing: boolean; 
  is_shipping: boolean; 
  created_at: string;
}

interface BackendUser { 
  user_id: number; 
  clerk_id: string; 
  role: string; 
  first_name: string; 
  last_name: string; 
  email: string; 
  phone?: string; 
  created_at?: string; 
}

const ANIMATION_DURATION = 500;
const ANIMATION_DURATION_S = ANIMATION_DURATION / 1000;

// Empty State Component
const EmptyAddressState = ({ onAddAddress, theme }: { onAddAddress: () => void, theme: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <div 
      className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20"
      style={{ backgroundColor: `${theme.bg}80` }}
    >
      <MapPin className="w-10 h-10 opacity-80" />
    </div>
    <h3 className="text-2xl font-semibold opacity-80 mb-3">No addresses yet</h3>
    <p className="opacity-80 mb-8 max-w-md mx-auto">
      Add your first address to make checkout faster and manage your shipping preferences.
    </p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onAddAddress}
      className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25 backdrop-blur-md"
    >
      <Plus className="w-5 h-5 inline mr-2" />
      Add Your First Address
    </motion.button>
  </motion.div>
);

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { getBackendProfile, getAddresses, addAddress, updateAddress, deleteAddress, updateUserProfile } = useApi();
  const { theme } = useTheme();

  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingAddressId, setProcessingAddressId] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);

  // Fixed: Safe window check for mobile detection
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }, []);

  // Particle system
  const particlePositions = useMemo(
    () =>
      [...Array(isMobile ? 8 : 16)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 1,
        yOffset: Math.random() * 30 - 15,
        opacityRange: Math.random() * 0.2 + 0.1,
        scaleRange: Math.random() * 0.3 + 0.3,
      })),
    [isMobile]
  );

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  const [addressForm, setAddressForm] = useState({ 
    street: '', 
    city: '', 
    state: '', 
    country: '', 
    postal_code: '', 
    is_billing: false, 
    is_shipping: false 
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, count: null },
    { id: 'addresses', label: 'Addresses', icon: MapPin, count: addresses.length }
  ];

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATION_S,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: ANIMATION_DURATION_S,
        type: "spring",
        stiffness: 120,
        damping: 12
      }
    })
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATION_S,
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const [profileResult, addressesResult] = await Promise.all([
          getBackendProfile(), 
          getAddresses()
        ]);
        
        if (profileResult.success) {
          setBackendUser(profileResult.data.user);
          setProfileForm({
            first_name: profileResult.data.user.first_name || '',
            last_name: profileResult.data.user.last_name || '',
            email: profileResult.data.user.email || '',
            phone: profileResult.data.user.phone || ''
          });
        }
        
        // FIXED: Properly handle addresses response structure
        if (addressesResult.success) {
          // Handle both array and object with data property
          const addressesData = Array.isArray(addressesResult.data) 
            ? addressesResult.data 
            : addressesResult.data?.data || [];
          setAddresses(addressesData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile data');
      } finally { 
        setLoading(false); 
      }
    };
    fetchProfileData();
  }, [user]);

  // Address handlers
  const resetAddressForm = () => setAddressForm({ 
    street: '', city: '', state: '', country: '', postal_code: '', 
    is_billing: false, is_shipping: false 
  });

  const startEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({ 
      street: addr.street,
      city: addr.city,
      state: addr.state,
      country: addr.country,
      postal_code: addr.postal_code,
      is_billing: addr.is_billing,
      is_shipping: addr.is_shipping
    });
    setShowAddressForm(true);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingAddress(null);
    setShowAddressForm(false);
    resetAddressForm();
    setError(null);
  };

  const cancelProfileEdit = () => {
    setEditingProfile(false);
    if (backendUser) {
      setProfileForm({
        first_name: backendUser.first_name || '',
        last_name: backendUser.last_name || '',
        email: backendUser.email || '',
        phone: backendUser.phone || ''
      });
    }
    setError(null);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    
    try {
      // Validation
      if (!profileForm.first_name?.trim() || !profileForm.last_name?.trim()) {
        throw new Error('First name and last name are required');
      }

      const updateData = {
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        phone: profileForm.phone?.trim() || null
      };

      // Call API
      const result = await updateUserProfile(updateData);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update profile');
      }

      // Update backendUser state
      if (result.data) {
        setBackendUser(result.data);
        
        // Re-fetch the latest data from server to ensure consistency
        const freshProfile = await getBackendProfile();
        if (freshProfile.success) {
          setBackendUser(freshProfile.data.user || freshProfile.data);
        }
        
        setEditingProfile(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
      
    } catch (err: any) {
      console.error('Profile update failed:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setProcessing(true); 
    setError(null);
    try {
      const result = await addAddress(addressForm);
      if (result.success && result.data) {
        setAddresses(prev => [...prev, result.data]);
        setShowAddressForm(false);
        resetAddressForm();
        setSuccess('Address added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.error?.message || 'Failed to add address');
      }
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setProcessing(false); 
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!editingAddress) return; 
    setProcessing(true); 
    setError(null);
    try {
      const result = await updateAddress(editingAddress.address_id, addressForm);
      if (result.success && result.data) {
        setAddresses(prev => prev.map(a => 
          a.address_id === editingAddress.address_id ? result.data : a
        ));
        setEditingAddress(null);
        setShowAddressForm(false);
        resetAddressForm();
        setSuccess('Address updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.error?.message || 'Failed to update address');
      }
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setProcessing(false); 
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setProcessingAddressId(id);
    setError(null);
    try {
      const result = await deleteAddress(id);
      if (result.success) {
        setAddresses(prev => prev.filter(a => a.address_id !== id));
        setSuccess('Address deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.error?.message || 'Failed to delete address');
      }
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setProcessingAddressId(null); 
    }
  };

  if (!isLoaded || loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center backdrop-blur-md transition-colors duration-300"
        style={{ backgroundColor: theme.bg, color: theme.text }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-b-2 border-orange-500"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center backdrop-blur-md transition-colors duration-300"
        style={{ backgroundColor: theme.bg, color: theme.text }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p>Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen py-8 backdrop-blur-md transition-colors duration-300"
      style={{ backgroundColor: theme.bg, color: theme.text }}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particlePositions.map((pos, i) => (
          <motion.div 
            key={i} 
            className="absolute w-1 h-1 rounded-full" 
            style={{ 
              left: pos.left, 
              top: pos.top,
              backgroundColor: `${theme.text}20`
            }} 
            animate={{ 
              y: [0, pos.yOffset, 0], 
              opacity: [0, pos.opacityRange, 0], 
              scale: [0, pos.scaleRange, 0] 
            }} 
            transition={{ 
              duration: pos.duration, 
              repeat: Infinity, 
              delay: pos.delay, 
              ease: "easeInOut" 
            }} 
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div 
            className="relative inline-block mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div 
              className="w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-400 rounded-full flex items-center justify-center shadow-2xl border-4 backdrop-blur-md"
              style={{ borderColor: theme.bg }}
            >
              {user.imageUrl && !imageError ? (
                <img 
                  src={user.imageUrl} 
                  alt={user.fullName || 'User'} 
                  className="w-28 h-28 rounded-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 backdrop-blur-md"
            >
              <Camera className="w-5 h-5" />
            </motion.button>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent"
          >
            {user.fullName || 'User'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg mb-4 opacity-80"
          >
            {user.primaryEmailAddress?.emailAddress}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-3 flex-wrap"
          >
            <span 
              className="px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border border-white/20"
              style={{ backgroundColor: `${theme.bg}80` }}
            >
              {backendUser?.role || 'User'}
            </span>
            <span 
              className="px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border border-white/20"
              style={{ backgroundColor: `${theme.bg}80` }}
            >
              Member since {new Date(user.createdAt!).getFullYear()}
            </span>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl p-6 shadow-lg border border-white/20 backdrop-blur-md sticky top-8"
              style={{ backgroundColor: `${theme.bg}80` }}
            >
              <nav className="space-y-2">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-semibold transition-all duration-300 backdrop-blur-md border ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25 border-orange-500/50'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      style={{ 
                        backgroundColor: activeTab === tab.id ? 'transparent' : `${theme.bg}40`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </div>
                      {tab.count !== null && (
                        <span 
                          className={`text-sm px-2 py-1 rounded-full ${
                            activeTab === tab.id 
                              ? 'bg-white text-orange-600' 
                              : 'bg-white/20 text-current'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* Notifications */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border border-red-200 dark:border-red-800 px-6 py-4 rounded-2xl mb-6 backdrop-blur-md"
                  style={{ backgroundColor: `${theme.bg}80` }}
                >
                  <span className="text-red-500">{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border border-green-200 dark:border-green-800 px-6 py-4 rounded-2xl mb-6 backdrop-blur-md"
                  style={{ backgroundColor: `${theme.bg}80` }}
                >
                  <span className="text-green-500">{success}</span>
                </motion.div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Personal Information Card */}
                  <motion.div 
                    variants={cardVariants}
                    className="rounded-3xl p-8 shadow-lg border border-white/20 backdrop-blur-md"
                    style={{ backgroundColor: `${theme.bg}80` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                      <div>
                        <h2 className="text-2xl font-bold">Personal Information</h2>
                        <p className="opacity-80 mt-1">Manage your personal details and contact information</p>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => editingProfile ? cancelProfileEdit() : setEditingProfile(true)}
                        className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25 backdrop-blur-md"
                      >
                        {editingProfile ? 'Cancel Edit' : 'Edit Profile'}
                      </motion.button>
                    </div>
                    
                    <form onSubmit={handleProfileUpdate}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium mb-2 block opacity-80">First Name</label>
                            {editingProfile ? (
                              <input
                                type="text"
                                value={profileForm.first_name || ''}
                                onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                                className="w-full rounded-2xl px-4 py-3 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 backdrop-blur-md border border-white/20"
                                style={{ backgroundColor: `${theme.bg}60` }}
                                required
                              />
                            ) : (
                              <div className="p-4 rounded-2xl border border-white/20 backdrop-blur-md" style={{ backgroundColor: `${theme.bg}60` }}>
                                <p className="font-semibold">{backendUser?.first_name || 'Not provided'}</p>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-2 block opacity-80">Email Address</label>
                            <div className="p-4 rounded-2xl border border-white/20 backdrop-blur-md flex items-center gap-3" style={{ backgroundColor: `${theme.bg}60` }}>
                              <Mail className="w-5 h-5 text-orange-500" />
                              <p className="font-semibold">{user.primaryEmailAddress?.emailAddress}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium mb-2 block opacity-80">Last Name</label>
                            {editingProfile ? (
                              <input
                                type="text"
                                value={profileForm.last_name || ''}
                                onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                                className="w-full rounded-2xl px-4 py-3 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 backdrop-blur-md border border-white/20"
                                style={{ backgroundColor: `${theme.bg}60` }}
                                required
                              />
                            ) : (
                              <div className="p-4 rounded-2xl border border-white/20 backdrop-blur-md" style={{ backgroundColor: `${theme.bg}60` }}>
                                <p className="font-semibold">{backendUser?.last_name || 'Not provided'}</p>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-2 block opacity-80">Phone Number</label>
                            {editingProfile ? (
                              <input
                                type="tel"
                                value={profileForm.phone || ''}
                                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                                className="w-full rounded-2xl px-4 py-3 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 backdrop-blur-md border border-white/20"
                                style={{ backgroundColor: `${theme.bg}60` }}
                              />
                            ) : (
                              <div className="p-4 rounded-2xl border border-white/20 backdrop-blur-md flex items-center gap-3" style={{ backgroundColor: `${theme.bg}60` }}>
                                <Phone className="w-5 h-5 text-orange-500" />
                                <p className="font-semibold">
                                  {backendUser?.phone || 'Not provided'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {editingProfile && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex gap-4 pt-8 mt-8 border-t border-white/20"
                        >
                          <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 backdrop-blur-md"
                          >
                            {processing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={cancelProfileEdit}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 backdrop-blur-md border border-white/20"
                            style={{ backgroundColor: `${theme.bg}60` }}
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </motion.div>
                      )}
                    </form>
                  </motion.div>
                </motion.div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Header */}
                  <motion.div 
                    variants={cardVariants}
                    className="rounded-3xl p-8 shadow-lg border border-white/20 backdrop-blur-md"
                    style={{ backgroundColor: `${theme.bg}80` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold">Your Addresses</h2>
                        <p className="opacity-80 mt-1">Manage your shipping and billing addresses</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddressForm(true)}
                        disabled={showAddressForm}
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 disabled:bg-gray-300 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25 backdrop-blur-md"
                      >
                        <Plus className="w-5 h-5" />
                        Add New Address
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Address Form */}
                  <AnimatePresence>
                    {(showAddressForm || editingAddress) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-3xl p-8 shadow-lg border border-white/20 backdrop-blur-md"
                        style={{ backgroundColor: `${theme.bg}80` }}
                      >
                        <h3 className="text-xl font-bold mb-6">
                          {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </h3>
                        
                        <form onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['street', 'city', 'state', 'country', 'postal_code'].map((field) => (
                              <div key={field} className="space-y-2">
                                <label className="text-sm font-medium capitalize opacity-80">
                                  {field.replace('_', ' ')}
                                </label>
                                <input
                                  type="text"
                                  value={addressForm[field as keyof typeof addressForm] as string}
                                  onChange={(e) => setAddressForm({...addressForm, [field]: e.target.value})}
                                  className="w-full rounded-2xl px-4 py-3 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 backdrop-blur-md border border-white/20"
                                  style={{ backgroundColor: `${theme.bg}60` }}
                                  placeholder={`Enter ${field.replace('_', ' ')}`}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-6 flex-wrap">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={addressForm.is_billing}
                                onChange={(e) => setAddressForm({...addressForm, is_billing: e.target.checked})}
                                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 focus:ring-2 backdrop-blur-md"
                                style={{ backgroundColor: `${theme.bg}60` }}
                              />
                              <CreditCard className="w-4 h-4 opacity-80" />
                              <span className="opacity-80">Billing Address</span>
                            </label>
                            
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={addressForm.is_shipping}
                                onChange={(e) => setAddressForm({...addressForm, is_shipping: e.target.checked})}
                                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 focus:ring-2 backdrop-blur-md"
                                style={{ backgroundColor: `${theme.bg}60` }}
                              />
                              <Truck className="w-4 h-4 opacity-80" />
                              <span className="opacity-80">Shipping Address</span>
                            </label>
                          </div>
                          
                          <div className="flex gap-4 pt-4">
                            <button
                              type="submit"
                              disabled={processing}
                              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 backdrop-blur-md"
                            >
                              {processing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              {editingAddress ? 'Update Address' : 'Save Address'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 backdrop-blur-md border border-white/20"
                              style={{ backgroundColor: `${theme.bg}60` }}
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Addresses Grid - FIXED: Use addresses directly instead of addresses.data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {addresses.map((address, index) => (
                      <motion.div
                        key={address.address_id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                        className="rounded-3xl p-6 shadow-lg border border-white/20 hover:border-orange-500/50 transition-all duration-300 backdrop-blur-md group"
                        style={{ backgroundColor: `${theme.bg}80` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <Home className="w-5 h-5 text-orange-500" />
                            <h3 className="font-semibold">Address #{address.address_id}</h3>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => startEditAddress(address)}
                              className="p-2 rounded-xl transition-colors backdrop-blur-md border border-white/20"
                              style={{ backgroundColor: `${theme.bg}60` }}
                            >
                              <Edit2 className="w-4 h-4 opacity-80 hover:text-orange-500" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteAddress(address.address_id)}
                              disabled={processingAddressId === address.address_id}
                              className="p-2 rounded-xl transition-colors backdrop-blur-md border border-white/20"
                              style={{ backgroundColor: `${theme.bg}60` }}
                            >
                              {processingAddressId === address.address_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 opacity-80 hover:text-red-500" />
                              )}
                            </motion.button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-sm leading-relaxed opacity-80">
                            {address.street}, {address.city}<br />
                            {address.state}, {address.country}<br />
                            {address.postal_code}
                          </p>
                          
                          <div className="flex gap-2 pt-2">
                            {address.is_billing && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-md border border-white/20"
                                style={{ backgroundColor: `${theme.bg}60` }}
                              >
                                <CreditCard className="w-3 h-3" />
                                Billing
                              </span>
                            )}
                            {address.is_shipping && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-md border border-white/20"
                                style={{ backgroundColor: `${theme.bg}60` }}
                              >
                                <Truck className="w-3 h-3" />
                                Shipping
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {addresses.length === 0 && !showAddressForm && (
                      <div className="col-span-full">
                        <EmptyAddressState 
                          onAddAddress={() => setShowAddressForm(true)} 
                          theme={theme}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}