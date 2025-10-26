'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/CartContext';
import { useTheme, generateThemeStyles, withOpacity } from '@/lib/ThemeProvider';
import { 
  CreditCard, 
  Lock, 
  Truck, 
  Shield, 
  ArrowLeft, 
  CheckCircle,
  Clock,
  MapPin,
  User,
  Mail,
  Home,
  Globe,
  FileText,
  LogIn,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Package,
  AlertCircle,
  Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import { useApi } from '@/lib/api';
import debounce from 'lodash/debounce';

// Enhanced Types
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
  phone?: string;
  label?: string;
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

interface OrderItem {
  product_id: number;
  variant_id: number;
  name: string;
  price: number;
  unit_price: number;
  quantity: number;
  size: string;
  color?: string;
  image: string;
  product_name?: string;
}

interface OrderData {
  items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  payment_intent_id?: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  user_id: number;
  email: string;
  phone?: string;
}

interface CreateOrderResponse {
  success: boolean;
  data?: {
    order_id: number;
    tracking_number: string;
    total_amount: number;
    items: OrderItem[];
    shipping_address: Address;
    estimated_delivery: string;
    order_date: string;
  };
  error?: {
    message: string;
  };
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay';
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
  icon: React.ReactNode;
}

const CheckoutPage = () => {
  const { cartItems, clearCart, getCartTotal, updateItemQuantity, removeFromCart } = useCart();
  const { getBackendProfile, getAddresses, addAddress, updateAddress, deleteAddress, createOrder, updateUserProfile } = useApi();
  const { theme, currentThemeName } = useTheme();
  const themeStyles = generateThemeStyles(theme, currentThemeName);
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [processingAddressId, setProcessingAddressId] = useState<number | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [responseOrderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<string>('standard');
  const [selectedPayment, setSelectedPayment] = useState<string>('card');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [isGift, setIsGift] = useState(false);
console.log('check responseOrderData;-',responseOrderData);
  // Enhanced form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    country: 'United States',
    postalCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    saveInfo: false,
    sameAsShipping: true
  });

  const [addressForm, setAddressForm] = useState({ 
    street: '', 
    city: '', 
    state: '', 
    country: 'United States', 
    postal_code: '', 
    is_billing: false, 
    is_shipping: true,
    label: 'Home',
    phone: ''
  });

  // Payment Methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      type: 'card',
      label: 'Credit/Debit Card',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Pay with Visa, Mastercard, or American Express'
    },
    {
      id: 'paypal',
      type: 'paypal',
      label: 'PayPal',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M7.5 14.25c0 .83.67 1.5 1.5 1.5h3c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5H9c-.83 0-1.5.67-1.5 1.5zM21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
        </svg>
      ),
      description: 'Pay with your PayPal account'
    },
    {
      id: 'apple_pay',
      type: 'apple_pay',
      label: 'Apple Pay',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      description: 'Pay with Apple Pay'
    }
  ];

  // Shipping Methods
  const shippingMethods: ShippingMethod[] = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: '5-7 business days',
      price: 4.99,
      estimated_days: '5-7 business days',
      icon: <Truck className="w-5 h-5" />
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: '2-3 business days',
      price: 9.99,
      estimated_days: '2-3 business days',
      icon: <Clock className="w-5 h-5" />
    },
    {
      id: 'overnight',
      name: 'Overnight Shipping',
      description: 'Next business day',
      price: 19.99,
      estimated_days: '1 business day',
      icon: <Package className="w-5 h-5" />
    },
    {
      id: 'free',
      name: 'Free Shipping',
      description: '8-10 business days',
      price: 0,
      estimated_days: '8-10 business days',
      icon: <Truck className="w-5 h-5" />
    }
  ];

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const slideVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 }
  };

  // Enhanced totals calculation with memoization
  const { subtotal, shipping, tax, total, discount, finalTotal } = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.discountedPrice) || parseFloat(item.originalPrice);
      return sum + (price * item.quantity);
    }, 0);
    
    const shippingMethod = shippingMethods.find(method => method.id === selectedShipping);
    const shipping = shippingMethod ? shippingMethod.price : 4.99;
    
    // Apply free shipping threshold
    const freeShipping = subtotal > 50 && selectedShipping === 'free';
    const shippingCost = freeShipping ? 0 : shipping;
    
    const tax = subtotal * 0.08;
    const discount = appliedCoupon ? (subtotal * (appliedCoupon.discount_percent / 100)) : 0;
    const totalBeforeDiscount = subtotal + shippingCost + tax;
    const finalTotal = totalBeforeDiscount - discount;
    
    return { 
      subtotal, 
      shipping: shippingCost, 
      tax, 
      total: totalBeforeDiscount,
      discount,
      finalTotal 
    };
  }, [cartItems, selectedShipping, appliedCoupon]);

  // Enhanced fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isSignedIn || !user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        setError(null);
        const [profileResult, addressesResult] = await Promise.all([
          getBackendProfile(),
          getAddresses()
        ]);
        
        if (profileResult.success && profileResult.data?.user) {
          const userData = profileResult.data.user;
          setBackendUser(userData);
          setFormData(prev => ({
            ...prev,
            email: user.primaryEmailAddress?.emailAddress || '',
            firstName: userData.first_name || user.firstName || '',
            lastName: userData.last_name || user.lastName || '',
            phone: userData.phone || ''
          }));
        }
        
        if (addressesResult.success) {
          const addressesData = addressesResult.data?.data || addressesResult.data || [];
          setAddresses(addressesData);
          
          const defaultShipping = addressesData.find(addr => addr.is_shipping);
          if (defaultShipping) {
            setSelectedAddress(defaultShipping);
            setFormData(prev => ({
              ...prev,
              address: defaultShipping.street,
              city: defaultShipping.city,
              state: defaultShipping.state,
              country: defaultShipping.country,
              postalCode: defaultShipping.postal_code
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchProfileData();
    }
  }, [isLoaded, isSignedIn, user]);

  // Enhanced input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enhanced address management
  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setFormData(prev => ({
      ...prev,
      address: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postal_code,
      phone: address.phone || prev.phone
    }));
  };

  const resetAddressForm = () => {
    setAddressForm({ 
      street: '', 
      city: '', 
      state: '', 
      country: 'United States', 
      postal_code: '', 
      is_billing: false, 
      is_shipping: true,
      label: 'Home',
      phone: ''
    });
    setEditingAddress(null);
  };

  const startEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postal_code: address.postal_code,
      is_billing: address.is_billing,
      is_shipping: address.is_shipping,
      label: address.label || 'Home',
      phone: address.phone || ''
    });
    setShowAddressForm(true);
  };

  const cancelAddressEdit = () => {
    setShowAddressForm(false);
    resetAddressForm();
  };

  // Enhanced address operations
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
        toast.success('Address added successfully!');
        handleAddressSelect(result.data);
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
        toast.success('Address updated successfully!');
        
        if (selectedAddress?.address_id === editingAddress.address_id) {
          handleAddressSelect(result.data);
        }
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
        
        if (selectedAddress?.address_id === id) {
          setSelectedAddress(null);
          setFormData(prev => ({
            ...prev,
            address: '',
            city: '',
            state: '',
            country: '',
            postalCode: ''
          }));
        }
        
        toast.success('Address deleted successfully!');
      } else {
        throw new Error(result.error?.message || 'Failed to delete address');
      }
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setProcessingAddressId(null); 
    }
  };

  // Enhanced profile update with debouncing
  const debouncedUpdateProfile = useCallback(
    debounce(async (updateData: any) => {
      try {
        await updateUserProfile(updateData);
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    }, 1000),
    []
  );

  const handleUpdateProfile = async () => {
    if (!backendUser) return;
    
    setUpdatingProfile(true);
    setError(null);
    
    try {
      const updateData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone?.trim() || null
      };

      const result = await updateUserProfile(updateData);

      if (result.success) {
        const profileResult = await getBackendProfile();
        if (profileResult.success && profileResult.data?.user) {
          setBackendUser(profileResult.data.user);
        }
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(result.error?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Enhanced validation
  const validateShippingStep = () => {
    const errors: string[] = [];

    if (!formData.firstName.trim()) errors.push('First name is required');
    if (!formData.lastName.trim()) errors.push('Last name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.address.trim()) errors.push('Address is required');
    if (!formData.city.trim()) errors.push('City is required');
    if (!formData.state.trim()) errors.push('State is required');
    if (!formData.postalCode.trim()) errors.push('Postal code is required');
    if (!formData.country.trim()) errors.push('Country is required');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (errors.length > 0) {
      setError(errors[0]);
      return false;
    }

    return true;
  };

  const validatePaymentStep = () => {
    const errors: string[] = [];

    if (selectedPayment === 'card') {
      const cardNumber = formData.cardNumber.replace(/\s/g, '');
      if (!cardNumber.match(/^\d{16}$/)) errors.push('Card number must be 16 digits');
      if (!formData.expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
        errors.push('Expiry date must be in MM/YY format');
      }
      if (!formData.cvv.match(/^\d{3,4}$/)) errors.push('CVV must be 3 or 4 digits');
      if (!formData.nameOnCard.trim()) errors.push('Name on card is required');
    }

    if (errors.length > 0) {
      setError(errors[0]);
      return false;
    }

    return true;
  };

  // Enhanced step navigation
  const handleNextStep = () => {
    setError(null);
    
    if (activeStep === 1) {
      if (!validateShippingStep()) return;
      
      if (formData.phone !== backendUser?.phone) {
        handleUpdateProfile();
      }
      
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!validatePaymentStep()) return;
      setActiveStep(3);
    }
  };

  const handlePreviousStep = () => {
    setError(null);
    setActiveStep(activeStep - 1);
  };

  // Enhanced coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock coupon validation
      const validCoupons = {
        'WELCOME10': { discount_percent: 10, min_order: 0 },
        'SAVE20': { discount_percent: 20, min_order: 50 },
        'FREESHIP': { discount_percent: 0, free_shipping: true }
      };

      const coupon = validCoupons[couponCode.toUpperCase() as keyof typeof validCoupons];
      
      if (coupon) {
        if (subtotal >= coupon.min_order) {
          setAppliedCoupon({
            code: couponCode.toUpperCase(),
            ...coupon
          });
          toast.success(`Coupon applied! ${coupon.discount_percent}% discount.`);
        } else {
          setError(`Minimum order of $${coupon.min_order} required for this coupon`);
        }
      } else {
        setError('Invalid coupon code');
      }
    } catch (err: any) {
      setError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Enhanced order placement
  const handlePlaceOrder = async () => {
    if (!isSignedIn || !backendUser || !selectedAddress) {
      setError('Please complete all required information');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const orderData: OrderData = {
        items: cartItems.map(item => ({
          product_id: item.id,
          variant_id: item.variant_id || item.id,
          name: item.name,
          price: parseFloat(item.discountedPrice) || parseFloat(item.originalPrice),
          unit_price: parseFloat(item.discountedPrice) || parseFloat(item.originalPrice),
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: item.image,
          product_name: item.name
        })),
        shipping_address: {
          ...selectedAddress,
          street: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postalCode,
          phone: formData.phone
        },
        billing_address: formData.sameAsShipping ? {
          ...selectedAddress,
          street: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postalCode
        } : {
          ...selectedAddress,
          street: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postalCode,
          is_billing: true,
          is_shipping: false
        },
        payment_method: selectedPayment,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: finalTotal,
        user_id: backendUser.user_id,
        email: formData.email,
        phone: formData.phone
      };

      const result = await createOrder(orderData);

      if (result.success && result.data) {
        setOrderData(result);
        toast.success('Order placed successfully!');
        clearCart();
        setActiveStep(4);
      } else {
        throw new Error(result.error?.message || 'Failed to place order');
      }
    } catch (err: any) {
      console.error('Order placement error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Enhanced formatting functions
  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 5);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  // Enhanced steps configuration
  const steps = [
    { id: 1, name: 'Shipping', icon: Truck, description: 'Add your delivery details' },
    { id: 2, name: 'Payment', icon: CreditCard, description: 'Secure payment information' },
    { id: 3, name: 'Review', icon: CheckCircle, description: 'Confirm your order' }
  ];

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen pt-20 transition-colors duration-300" style={themeStyles.container}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div 
              className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center" 
              style={{ backgroundColor: withOpacity(theme.bg, 0.1) }}
            >
              <CreditCard className="w-12 h-12" style={{ color: theme.bg }} />
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold mb-4" 
              style={{ color: themeStyles.text.primary }}
            >
              Loading...
            </motion.h1>
          </motion.div>
        </div>
      </div>
    );
  }

  // Sign in required state
  if (!isSignedIn) {
    return (
      <div className="min-h-screen pt-20 transition-colors duration-300" style={themeStyles.container}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center"
          >
            <motion.div 
              className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center" 
              style={{ backgroundColor: withOpacity(theme.bg, 0.1) }}
            >
              <LogIn className="w-12 h-12" style={{ color: theme.bg }} />
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold mb-4" 
              style={{ color: themeStyles.text.primary }}
            >
              Sign In Required
            </motion.h1>
            <motion.p 
              className="text-lg mb-8 max-w-md mx-auto" 
              style={{ color: themeStyles.text.secondary }}
            >
              Please sign in to your account to proceed with checkout and save your order details.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <SignInButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg flex items-center gap-3"
                  style={{ 
                    backgroundColor: themeStyles.button.primary.backgroundColor,
                    color: themeStyles.button.primary.textColor
                  }}
                >
                  <LogIn className="w-5 h-5" />
                  Sign In to Checkout
                </motion.button>
              </SignInButton>
              
              <SignUpButton mode="modal">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl font-semibold border-2 transition-all duration-300 flex items-center gap-3"
                  style={{
                    borderColor: themeStyles.button.secondary.borderColor,
                    color: themeStyles.button.secondary.textColor,
                    backgroundColor: themeStyles.button.secondary.backgroundColor
                  }}
                >
                  Create Account
                </motion.button>
              </SignUpButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0 && activeStep !== 4) {
    return (
      <div className="min-h-screen pt-20 transition-colors duration-300" style={themeStyles.container}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div 
              className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center" 
              style={{ backgroundColor: withOpacity(theme.bg, 0.1) }}
            >
              <CreditCard className="w-12 h-12" style={{ color: theme.bg }} />
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold mb-4" 
              style={{ color: themeStyles.text.primary }}
            >
              Your cart is empty
            </motion.h1>
            <motion.p 
              className="text-lg mb-8" 
              style={{ color: themeStyles.text.secondary }}
            >
              Add some items to your cart before checking out
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/products')}
              className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg"
              style={{ 
                backgroundColor: themeStyles.button.primary.backgroundColor,
                color: themeStyles.button.primary.textColor
              }}
            >
              Continue Shopping
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 transition-colors duration-300" style={themeStyles.container}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mb-12"
        >
          <motion.button
            variants={itemVariants}
            onClick={() => router.back()}
            className="flex items-center gap-3 mb-8 group transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-opacity-10"
            style={{ color: themeStyles.text.secondary, backgroundColor: withOpacity(theme.bg, 0.05) }}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to cart
          </motion.button>
          
          <div className="text-center mb-12">
            <motion.h1 
              variants={itemVariants}
              className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" 
            >
              Checkout
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-xl" 
              style={{ color: themeStyles.text.secondary }}
            >
              Complete your purchase securely
            </motion.p>
            
            {/* User info */}
            {user && (
              <motion.div 
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ 
                  backgroundColor: withOpacity(theme.bg, 0.1),
                  color: themeStyles.text.secondary
                }}
                variants={itemVariants}
              >
                <User className="w-4 h-4" />
                <span className="text-sm">
                  Signed in as {user.firstName} {user.lastName}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <div className="flex items-center justify-center relative">
            <div 
              className="absolute top-6 left-1/2 transform -translate-x-1/2 w-3/4 h-1 rounded-full -z-10"
              style={{ backgroundColor: themeStyles.progress.inactive }}
            />
            <div 
              className="absolute top-6 left-1/2 transform -translate-x-1/2 h-1 rounded-full transition-all duration-500 -z-10"
              style={{ 
                backgroundColor: themeStyles.progress.active,
                width: `${((activeStep - 1) / (steps.length - 1)) * 75}%`,
                left: `${12.5 + ((activeStep - 1) / (steps.length - 1)) * 75}%`
              }}
            />
            
            {steps.map((step, index) => (
              <motion.div 
                key={step.id} 
                className="flex flex-col items-center relative"
                variants={itemVariants}
                style={{ width: `${100 / steps.length}%` }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-300 mb-4 ${
                    activeStep >= step.id ? 'shadow-lg' : ''
                  }`}
                  style={{
                    backgroundColor: activeStep >= step.id ? themeStyles.progress.active : themeStyles.card.backgroundColor,
                    borderColor: activeStep >= step.id ? themeStyles.progress.active : themeStyles.progress.inactive,
                    color: activeStep >= step.id ? '#ffffff' : themeStyles.text.muted,
                    boxShadow: activeStep >= step.id ? `0 8px 32px ${withOpacity(themeStyles.progress.active, 0.3)}` : 'none'
                  }}
                >
                  <step.icon className="w-7 h-7" />
                </motion.div>
                
                <div className="text-center">
                  <p 
                    className={`text-sm font-semibold mb-1 transition-colors duration-300 ${
                      activeStep >= step.id ? 'font-bold' : ''
                    }`}
                    style={{
                      color: activeStep >= step.id ? themeStyles.progress.active : themeStyles.text.primary
                    }}
                  >
                    {step.name}
                  </p>
                  <p 
                    className="text-xs transition-colors duration-300"
                    style={{ color: themeStyles.text.muted }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto mb-6 p-4 rounded-xl border border-red-200 dark:border-red-800"
            style={{ backgroundColor: withOpacity('#fef2f2', 0.8) }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Forms */}
          <div className="xl:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Shipping */}
              {activeStep === 1 && (
                <motion.div
                  key="shipping"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-3xl p-8 border backdrop-blur-sm transition-all duration-300"
                  style={{
                    ...themeStyles.card,
                    boxShadow: themeStyles.card.shadow
                  }}
                >
                  <motion.div
                    className="flex items-center gap-3 mb-8 pb-6 border-b"
                    style={{ borderColor: themeStyles.card.borderColor }}
                    variants={itemVariants}
                  >
                    <div className="p-3 rounded-xl" style={{ backgroundColor: withOpacity(theme.bg, 0.1) }}>
                      <MapPin className="w-6 h-6" style={{ color: theme.bg }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: themeStyles.text.primary }}>
                        Shipping Information
                      </h2>
                      <p className="text-sm" style={{ color: themeStyles.text.secondary }}>
                        Where should we deliver your order?
                      </p>
                    </div>
                  </motion.div>

                  {/* Contact Information */}
                  <motion.div variants={itemVariants} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.text.primary }}>
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                          style={{
                            backgroundColor: themeStyles.input.backgroundColor,
                            borderColor: themeStyles.input.borderColor,
                            color: themeStyles.input.textColor
                          }}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                            style={{
                              backgroundColor: themeStyles.input.backgroundColor,
                              borderColor: themeStyles.input.borderColor,
                              color: themeStyles.input.textColor
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                            style={{
                              backgroundColor: themeStyles.input.backgroundColor,
                              borderColor: themeStyles.input.borderColor,
                              color: themeStyles.input.textColor
                            }}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            setFormData(prev => ({ ...prev, phone: formatted }));
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                          style={{
                            backgroundColor: themeStyles.input.backgroundColor,
                            borderColor: themeStyles.input.borderColor,
                            color: themeStyles.input.textColor
                          }}
                          placeholder="(555) 123-4567"
                          maxLength={14}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Shipping Methods */}
                  <motion.div variants={itemVariants} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.text.primary }}>
                      Shipping Method
                    </h3>
                    <div className="space-y-3">
                      {shippingMethods.map((method) => (
                        <motion.label
                          key={method.id}
                          whileHover={{ scale: 1.02 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                            selectedShipping === method.id ? 'border-green-500' : ''
                          }`}
                          style={{
                            borderColor: selectedShipping === method.id 
                              ? '#10b981' 
                              : themeStyles.card.borderColor,
                            backgroundColor: selectedShipping === method.id 
                              ? withOpacity('#10b981', 0.1)
                              : themeStyles.card.backgroundColor
                          }}
                        >
                          <input
                            type="radio"
                            name="shipping"
                            value={method.id}
                            checked={selectedShipping === method.id}
                            onChange={(e) => setSelectedShipping(e.target.value)}
                            className="hidden"
                          />
                          <div 
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedShipping === method.id ? 'border-green-500' : 'border-gray-300'
                            }`}
                          >
                            {selectedShipping === method.id && (
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {method.icon}
                              <span className="font-semibold" style={{ color: themeStyles.text.primary }}>
                                {method.name}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: themeStyles.text.secondary }}>
                              {method.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold" style={{ color: themeStyles.text.primary }}>
                              {method.price === 0 ? 'Free' : `$${method.price.toFixed(2)}`}
                            </p>
                            <p className="text-xs" style={{ color: themeStyles.text.muted }}>
                              {method.estimated_days}
                            </p>
                          </div>
                        </motion.label>
                      ))}
                    </div>
                  </motion.div>

                  {/* Saved Addresses */}
                  {addresses.length > 0 && (
                    <motion.div variants={itemVariants} className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold" style={{ color: themeStyles.text.primary }}>
                          Saved Addresses
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAddressForm(!showAddressForm)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300"
                          style={{
                            borderColor: themeStyles.button.secondary.borderColor,
                            color: themeStyles.button.secondary.textColor,
                            backgroundColor: themeStyles.button.secondary.backgroundColor
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          {showAddressForm ? 'Cancel' : 'New Address'}
                        </motion.button>
                      </div>
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <motion.div
                            key={address.address_id}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              selectedAddress?.address_id === address.address_id ? 'border-green-500' : ''
                            }`}
                            style={{
                              borderColor: selectedAddress?.address_id === address.address_id 
                                ? '#10b981' 
                                : themeStyles.card.borderColor,
                              backgroundColor: selectedAddress?.address_id === address.address_id 
                                ? withOpacity('#10b981', 0.1)
                                : themeStyles.card.backgroundColor
                            }}
                            onClick={() => handleAddressSelect(address)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold" style={{ color: themeStyles.text.primary }}>
                                    {address.label}
                                  </span>
                                  {address.is_default && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500 text-white">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="font-semibold" style={{ color: themeStyles.text.primary }}>
                                  {address.street}, {address.city}
                                </p>
                                <p className="text-sm" style={{ color: themeStyles.text.secondary }}>
                                  {address.state}, {address.country}, {address.postal_code}
                                </p>
                                {address.phone && (
                                  <p className="text-sm" style={{ color: themeStyles.text.secondary }}>
                                    {address.phone}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  {address.is_billing && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500 text-white">
                                      Billing
                                    </span>
                                  )}
                                  {address.is_shipping && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-green-500 text-white">
                                      Shipping
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditAddress(address);
                                  }}
                                  className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                                  style={{ backgroundColor: withOpacity(theme.bg, 0.1) }}
                                >
                                  <Edit2 className="w-4 h-4" style={{ color: theme.bg }} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAddress(address.address_id);
                                  }}
                                  disabled={processingAddressId === address.address_id}
                                  className="p-2 rounded-lg hover:bg-red-500 hover:bg-opacity-20 transition-colors"
                                  style={{ backgroundColor: withOpacity('#ef4444', 0.1) }}
                                >
                                  {processingAddressId === address.address_id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  )}
                                </button>
                              </div>
                              {selectedAddress?.address_id === address.address_id && (
                                <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Address Form */}
                  <AnimatePresence>
                    {showAddressForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-6 rounded-xl border"
                        style={{ borderColor: themeStyles.card.borderColor, backgroundColor: withOpacity(theme.bg, 0.05) }}
                      >
                        <h4 className="text-lg font-semibold mb-4" style={{ color: themeStyles.text.primary }}>
                          {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </h4>
                        <form onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium" style={{ color: themeStyles.text.primary }}>
                                Label *
                              </label>
                              <select
                                name="label"
                                value={addressForm.label}
                                onChange={handleAddressInputChange}
                                className="w-full px-3 py-2 rounded-lg border transition-all duration-300"
                                style={{
                                  backgroundColor: themeStyles.input.backgroundColor,
                                  borderColor: themeStyles.input.borderColor,
                                  color: themeStyles.input.textColor
                                }}
                                required
                              >
                                <option value="Home">Home</option>
                                <option value="Work">Work</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium" style={{ color: themeStyles.text.primary }}>
                                Phone
                              </label>
                              <input
                                type="tel"
                                name="phone"
                                value={addressForm.phone}
                                onChange={(e) => {
                                  const formatted = formatPhoneNumber(e.target.value);
                                  setAddressForm(prev => ({ ...prev, phone: formatted }));
                                }}
                                className="w-full px-3 py-2 rounded-lg border transition-all duration-300"
                                style={{
                                  backgroundColor: themeStyles.input.backgroundColor,
                                  borderColor: themeStyles.input.borderColor,
                                  color: themeStyles.input.textColor
                                }}
                                maxLength={14}
                              />
                            </div>
                            {['street', 'city', 'state', 'country', 'postal_code'].map((field) => (
                              <div key={field} className={field === 'street' ? 'md:col-span-2' : ''}>
                                <label className="text-sm font-medium capitalize block mb-2" style={{ color: themeStyles.text.primary }}>
                                  {field.replace('_', ' ')} *
                                </label>
                                <input
                                  type="text"
                                  name={field}
                                  value={addressForm[field as keyof typeof addressForm] as string}
                                  onChange={handleAddressInputChange}
                                  className="w-full px-3 py-2 rounded-lg border transition-all duration-300"
                                  style={{
                                    backgroundColor: themeStyles.input.backgroundColor,
                                    borderColor: themeStyles.input.borderColor,
                                    color: themeStyles.input.textColor
                                  }}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-4 items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={addressForm.is_shipping}
                                onChange={(e) => setAddressForm({...addressForm, is_shipping: e.target.checked})}
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm" style={{ color: themeStyles.text.primary }}>Shipping Address</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={addressForm.is_billing}
                                onChange={(e) => setAddressForm({...addressForm, is_billing: e.target.checked})}
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm" style={{ color: themeStyles.text.primary }}>Billing Address</span>
                            </label>
                          </div>
                          <div className="flex gap-4 pt-2">
                            <button
                              type="submit"
                              disabled={processing}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300"
                              style={{ 
                                backgroundColor: themeStyles.button.primary.backgroundColor,
                                color: themeStyles.button.primary.textColor
                              }}
                            >
                              {processing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              {editingAddress ? 'Update Address' : 'Save Address'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelAddressEdit}
                              className="px-4 py-2 rounded-lg font-semibold border transition-all duration-300"
                              style={{
                                borderColor: themeStyles.button.secondary.borderColor,
                                color: themeStyles.button.secondary.textColor,
                                backgroundColor: themeStyles.button.secondary.backgroundColor
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Manual Address Input */}
                  {(!addresses.length || !selectedAddress) && !showAddressForm && (
                    <motion.div variants={itemVariants} className="space-y-4">
                      <h3 className="text-lg font-semibold" style={{ color: themeStyles.text.primary }}>
                        Shipping Address
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                            Street Address *
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                            style={{
                              backgroundColor: themeStyles.input.backgroundColor,
                              borderColor: themeStyles.input.borderColor,
                              color: themeStyles.input.textColor
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                            Apartment, Suite, etc. (Optional)
                          </label>
                          <input
                            type="text"
                            name="apartment"
                            value={formData.apartment}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                            style={{
                              backgroundColor: themeStyles.input.backgroundColor,
                              borderColor: themeStyles.input.borderColor,
                              color: themeStyles.input.textColor
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                            style={{
                              backgroundColor: themeStyles.input.backgroundColor,
                              borderColor: themeStyles.input.borderColor,
                              color: themeStyles.input.textColor
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                            State *
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                            style={{
                              backgroundColor: themeStyles.input.backgroundColor,
                              borderColor: themeStyles.input.borderColor,
                              color: themeStyles.input.textColor
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                            Postal Code *
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                            style={{
                              backgroundColor: themeStyles.input.backgroundColor,
                              borderColor: themeStyles.input.borderColor,
                              color: themeStyles.input.textColor
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                            Country *
                          </label>
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                            style={{
                              backgroundColor: themeStyles.input.backgroundColor,
                              borderColor: themeStyles.input.borderColor,
                              color: themeStyles.input.textColor
                            }}
                            required
                          >
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                            <option value="Germany">Germany</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Gift Options */}
                  <motion.div variants={itemVariants} className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGift}
                        onChange={(e) => setIsGift(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm font-medium" style={{ color: themeStyles.text.primary }}>
                        This order contains a gift
                      </span>
                    </label>
                    {isGift && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4"
                      >
                        <label className="text-sm font-medium mb-2 block" style={{ color: themeStyles.text.primary }}>
                          Gift Message (Optional)
                        </label>
                        <textarea
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                          style={{
                            backgroundColor: themeStyles.input.backgroundColor,
                            borderColor: themeStyles.input.borderColor,
                            color: themeStyles.input.textColor
                          }}
                          placeholder="Add a personal message for the recipient..."
                        />
                      </motion.div>
                    )}
                  </motion.div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextStep}
                    className="w-full mt-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg"
                    style={{ 
                      backgroundColor: themeStyles.button.primary.backgroundColor,
                      color: themeStyles.button.primary.textColor
                    }}
                    variants={itemVariants}
                  >
                    Continue to Payment
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {activeStep === 2 && (
                <motion.div
                  key="payment"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-3xl p-8 border backdrop-blur-sm transition-all duration-300"
                  style={{
                    ...themeStyles.card,
                    boxShadow: themeStyles.card.shadow
                  }}
                >
                  <motion.div
                    className="flex items-center gap-3 mb-8 pb-6 border-b"
                    style={{ borderColor: themeStyles.card.borderColor }}
                    variants={itemVariants}
                  >
                    <div className="p-3 rounded-xl" style={{ backgroundColor: withOpacity(theme.bg, 0.1) }}>
                      <CreditCard className="w-6 h-6" style={{ color: theme.bg }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: themeStyles.text.primary }}>
                        Payment Information
                      </h2>
                      <p className="text-sm" style={{ color: themeStyles.text.secondary }}>
                        Secure payment with encryption
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Payment Methods */}
                  <motion.div variants={itemVariants} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.text.primary }}>
                      Payment Method
                    </h3>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <motion.label
                          key={method.id}
                          whileHover={{ scale: 1.02 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                            selectedPayment === method.id ? 'border-green-500' : ''
                          }`}
                          style={{
                            borderColor: selectedPayment === method.id 
                              ? '#10b981' 
                              : themeStyles.card.borderColor,
                            backgroundColor: selectedPayment === method.id 
                              ? withOpacity('#10b981', 0.1)
                              : themeStyles.card.backgroundColor
                          }}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={selectedPayment === method.id}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="hidden"
                          />
                          <div 
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPayment === method.id ? 'border-green-500' : 'border-gray-300'
                            }`}
                          >
                            {selectedPayment === method.id && (
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-1">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: withOpacity(theme.bg, 0.1) }}
                            >
                              {method.icon}
                            </div>
                            <div>
                              <span className="font-semibold block" style={{ color: themeStyles.text.primary }}>
                                {method.label}
                              </span>
                              <span className="text-sm" style={{ color: themeStyles.text.secondary }}>
                                {method.description}
                              </span>
                            </div>
                          </div>
                        </motion.label>
                      ))}
                    </div>
                  </motion.div>

                  {/* Card Details */}
                  {selectedPayment === 'card' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6"
                    >
                      <motion.div variants={itemVariants} className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: themeStyles.text.primary }}>
                          <CreditCard className="w-4 h-4" />
                          Card Number *
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            setFormData(prev => ({ ...prev, cardNumber: formatted }));
                          }}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                          style={{
                            backgroundColor: themeStyles.input.backgroundColor,
                            borderColor: themeStyles.input.borderColor,
                            color: themeStyles.input.textColor
                          }}
                          required
                        />
                      </motion.div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <motion.div variants={itemVariants} className="space-y-2">
                          <label className="text-sm font-medium" style={{ color: themeStyles.text.primary }}>
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={(e) => {
                              const formatted = formatExpiryDate(e.target.value);
                              setFormData(prev => ({ ...prev, expiryDate: formatted }));
                            }}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                            style={{
                              backgroundColor: themeStyles.input.backgroundColor,
                              borderColor: themeStyles.input.borderColor,
                              color: themeStyles.input.textColor
                            }}
                            required
                          />
                        </motion.div>
                        <motion.div variants={itemVariants} className="space-y-2">
                          <label className="text-sm font-medium" style={{ color: themeStyles.text.primary }}>
                            CVV *
                          </label>
                          <input
                            type="text"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            placeholder="123"
                            maxLength={4}
                            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                            style={{
                              backgroundColor: themeStyles.input.backgroundColor,
                              borderColor: themeStyles.input.borderColor,
                              color: themeStyles.input.textColor
                            }}
                            required
                          />
                        </motion.div>
                      </div>
                      
                      <motion.div variants={itemVariants} className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: themeStyles.text.primary }}>
                          <User className="w-4 h-4" />
                          Name on Card *
                        </label>
                        <input
                          type="text"
                          name="nameOnCard"
                          value={formData.nameOnCard}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300"
                          style={{
                            backgroundColor: themeStyles.input.backgroundColor,
                            borderColor: themeStyles.input.borderColor,
                            color: themeStyles.input.textColor
                          }}
                          required
                        />
                      </motion.div>

                      {/* Billing Address */}
                      <motion.div variants={itemVariants} className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="sameAsShipping"
                            checked={formData.sameAsShipping}
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm font-medium" style={{ color: themeStyles.text.primary }}>
                            Billing address same as shipping
                          </span>
                        </label>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Save Payment Method */}
                  <motion.div variants={itemVariants} className="mt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="saveInfo"
                        checked={formData.saveInfo}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: themeStyles.text.primary }}>
                        Save payment information for faster checkout
                      </span>
                    </label>
                  </motion.div>
                  
                  <div className="flex gap-4 mt-8">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePreviousStep}
                      className="flex-1 py-4 rounded-xl font-semibold border-2 transition-all duration-300"
                      style={{
                        borderColor: themeStyles.button.secondary.borderColor,
                        color: themeStyles.button.secondary.textColor,
                        backgroundColor: themeStyles.button.secondary.backgroundColor
                      }}
                      variants={itemVariants}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNextStep}
                      className="flex-1 py-4 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg"
                      style={{ 
                        backgroundColor: themeStyles.button.primary.backgroundColor,
                        color: themeStyles.button.primary.textColor
                      }}
                      variants={itemVariants}
                    >
                      Review Order
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {activeStep === 3 && (
                <motion.div
                  key="review"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-3xl p-8 border backdrop-blur-sm transition-all duration-300"
                  style={{
                    ...themeStyles.card,
                    boxShadow: themeStyles.card.shadow
                  }}
                >
                  <motion.div
                    className="flex items-center gap-3 mb-8 pb-6 border-b"
                    style={{ borderColor: themeStyles.card.borderColor }}
                    variants={itemVariants}
                  >
                    <div className="p-3 rounded-xl" style={{ backgroundColor: withOpacity(theme.bg, 0.1) }}>
                      <CheckCircle className="w-6 h-6" style={{ color: theme.bg }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: themeStyles.text.primary }}>
                        Review Your Order
                      </h2>
                      <p className="text-sm" style={{ color: themeStyles.text.secondary }}>
                        Confirm everything looks good
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Order Summary */}
                  <motion.div 
                    className="space-y-4 mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.text.primary }}>
                      Order Items ({cartItems.length})
                    </h3>
                    {cartItems.map((item, index) => (
                      <motion.div
                        key={`${item.id}-${item.size}-${item.color || ''}`}
                        variants={itemVariants}
                        className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
                        style={{ borderColor: themeStyles.card.borderColor, backgroundColor: withOpacity(theme.bg, 0.02) }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg" style={{ color: themeStyles.text.primary }}>
                            {item.name}
                          </h3>
                          <p className="text-sm" style={{ color: themeStyles.text.secondary }}>
                            Size: {item.size} | Color: {item.color || 'N/A'}
                          </p>
                          {item.appliedDiscount && (
                            <p className="text-xs font-medium text-green-500">
                              {item.appliedDiscount}% discount applied
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: themeStyles.text.primary }}>
                            ${(parseFloat(item.discountedPrice) || parseFloat(item.originalPrice)).toFixed(2)}
                          </p>
                          <p className="text-sm" style={{ color: themeStyles.text.muted }}>
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Shipping Information */}
                  <motion.div 
                    className="mb-6 p-6 rounded-xl border"
                    style={{ borderColor: themeStyles.card.borderColor, backgroundColor: withOpacity(theme.bg, 0.02) }}
                    variants={itemVariants}
                  >
                    <h4 className="font-semibold mb-3" style={{ color: themeStyles.text.primary }}>Shipping Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium" style={{ color: themeStyles.text.primary }}>Contact</p>
                        <p style={{ color: themeStyles.text.secondary }}>
                          {formData.email}<br />
                          {formData.phone}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: themeStyles.text.primary }}>Ship to</p>
                        <p style={{ color: themeStyles.text.secondary }}>
                          {formData.firstName} {formData.lastName}<br />
                          {formData.address}<br />
                          {formData.apartment && <>{formData.apartment}<br /></>}
                          {formData.city}, {formData.state} {formData.postalCode}<br />
                          {formData.country}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: themeStyles.card.borderColor }}>
                      <p className="font-medium" style={{ color: themeStyles.text.primary }}>Shipping Method</p>
                      <p style={{ color: themeStyles.text.secondary }}>
                        {shippingMethods.find(m => m.id === selectedShipping)?.name} - 
                        {shippingMethods.find(m => m.id === selectedShipping)?.price === 0 ? ' Free' : ` $${shippingMethods.find(m => m.id === selectedShipping)?.price.toFixed(2)}`}
                      </p>
                    </div>
                    {isGift && giftMessage && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: themeStyles.card.borderColor }}>
                        <p className="font-medium" style={{ color: themeStyles.text.primary }}>Gift Message</p>
                        <p style={{ color: themeStyles.text.secondary }}>{giftMessage}</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Payment Information */}
                  <motion.div 
                    className="mb-6 p-6 rounded-xl border"
                    style={{ borderColor: themeStyles.card.borderColor, backgroundColor: withOpacity(theme.bg, 0.02) }}
                    variants={itemVariants}
                  >
                    <h4 className="font-semibold mb-3" style={{ color: themeStyles.text.primary }}>Payment Method</h4>
                    <div className="flex items-center gap-3">
                      {paymentMethods.find(m => m.id === selectedPayment)?.icon}
                      <div>
                        <p style={{ color: themeStyles.text.primary }}>
                          {paymentMethods.find(m => m.id === selectedPayment)?.label}
                        </p>
                        {selectedPayment === 'card' && (
                          <p style={{ color: themeStyles.text.secondary }}>
                            Card ending in {formData.cardNumber.slice(-4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePreviousStep}
                      className="flex-1 py-4 rounded-xl font-semibold border-2 transition-all duration-300"
                      style={{
                        borderColor: themeStyles.button.secondary.borderColor,
                        color: themeStyles.button.secondary.textColor,
                        backgroundColor: themeStyles.button.secondary.backgroundColor
                      }}
                      variants={itemVariants}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePlaceOrder}
                      disabled={processing}
                      className="flex-1 py-4 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-3"
                      style={{ 
                        backgroundColor: processing ? themeStyles.text.muted : themeStyles.button.primary.backgroundColor,
                        color: themeStyles.button.primary.textColor
                      }}
                      variants={itemVariants}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          Place Order
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Success Step */}
              {activeStep === 4 && responseOrderData && responseOrderData.data && responseOrderData.data.data && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl p-12 border text-center backdrop-blur-sm transition-all duration-300"
                  style={{
                    ...themeStyles.card,
                    boxShadow: themeStyles.card.shadow
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="w-32 h-32 mx-auto mb-8 rounded-3xl flex items-center justify-center"
                    style={{ backgroundColor: withOpacity(theme.bg, 0.1) }}
                  >
                    <CheckCircle className="w-16 h-16" style={{ color: theme.bg }} />
                  </motion.div>
                  
                  <motion.h2 
                    className="text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Order Confirmed!
                  </motion.h2>
                  
                  {/* Order Details */}
                  <motion.div 
                    className="mb-6 p-6 rounded-2xl border-2"
                    style={{ 
                      borderColor: withOpacity(theme.bg, 0.3),
                      backgroundColor: withOpacity(theme.bg, 0.05)
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: themeStyles.text.secondary }}>
                      Your Tracking Number
                    </p>
                    <p className="text-3xl font-bold tracking-wider mb-3" style={{ color: theme.bg, letterSpacing: '2px' }}>
                      {responseOrderData.data.data.tracking_number}
                    </p>
                    <p className="text-sm" style={{ color: themeStyles.text.secondary }}>
                     Order #: {responseOrderData.data.data.order_id}
                    </p>
                    <p className="text-sm" style={{ color: themeStyles.text.secondary }}>
                      Total: ${responseOrderData.data.data.total_amount}
                    </p>
                    <p className="text-sm mt-2" style={{ color: themeStyles.text.secondary }}>
                      Use this number to track your package
                    </p>
                  </motion.div>
                  
                  {/* Order Items Summary */}
                  <motion.div 
                    className="mb-6 max-w-md mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="text-lg font-semibold mb-3" style={{ color: themeStyles.text.primary }}>
                      Order Summary
                    </h3>
                    <div className="space-y-2">
        {responseOrderData.data.data.items?.map((item: any, index: number) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span style={{ color: themeStyles.text.secondary }}>
              {item.quantity} × {item.product_name || 'Product'}
            </span>
            <span style={{ color: themeStyles.text.primary }} className="font-medium">
              ${(item.unit_price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
        <div className="border-t pt-2 mt-2" style={{ borderColor: themeStyles.card.borderColor }}>
          <div className="flex justify-between font-semibold">
            <span style={{ color: themeStyles.text.primary }}>Total</span>
            <span style={{ color: theme.bg }}>${responseOrderData.data.data.total_amount}</span>
          </div>
        </div>
      </div>
    </motion.div>
                  
                  <motion.p 
                    className="text-xl mb-8 max-w-md mx-auto" 
                    style={{ color: themeStyles.text.secondary }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Thank you for your purchase. Your order has been confirmed and will be shipped soon.
                  </motion.p>
                  
                  <motion.div 
                    className="flex gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/orders')}
                      className="px-8 py-4 rounded-xl font-semibold border-2 transition-all duration-300"
                      style={{
                        borderColor: themeStyles.button.secondary.borderColor,
                        color: themeStyles.button.secondary.textColor,
                        backgroundColor: themeStyles.button.secondary.backgroundColor
                      }}
                    >
                      View Orders
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/')}
                      className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg"
                      style={{ 
                        backgroundColor: themeStyles.button.primary.backgroundColor,
                        color: themeStyles.button.primary.textColor
                      }}
                    >
                      Continue Shopping
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-8">
            {/* Order Summary */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              transition={{ delay: 0.2 }}
              className="rounded-3xl p-8 border backdrop-blur-sm sticky top-8 transition-all duration-300"
              style={{
                ...themeStyles.card,
                boxShadow: themeStyles.card.shadow
              }}
            >
              <motion.h3 
                className="text-2xl font-bold mb-6 pb-4 border-b" 
                style={{ color: themeStyles.text.primary, borderColor: themeStyles.card.borderColor }}
                variants={itemVariants}
              >
                Order Summary
              </motion.h3>
              
              <motion.div 
                className="space-y-4 mb-6 max-h-96 overflow-y-auto"
                variants={containerVariants}
              >
                {cartItems.map((item, index) => (
                  <motion.div 
                    key={`${item.id}-${item.size}-${item.color || ''}`}
                    className="flex gap-4 items-center text-sm py-3 border-b"
                    style={{ borderColor: themeStyles.card.borderColor }}
                    variants={itemVariants}
                    custom={index}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <span style={{ color: themeStyles.text.primary }} className="font-medium block">
                        {item.name}
                      </span>
                      <span style={{ color: themeStyles.text.muted }} className="text-xs block">
                        Size: {item.size} | Color: {item.color || 'N/A'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ 
                            backgroundColor: withOpacity(theme.bg, 0.1),
                            color: theme.bg
                          }}
                        >
                          -
                        </button>
                        <span style={{ color: themeStyles.text.primary }} className="text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ 
                            backgroundColor: withOpacity(theme.bg, 0.1),
                            color: theme.bg
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span style={{ color: themeStyles.text.primary }} className="font-semibold block">
                        ${((parseFloat(item.discountedPrice) || parseFloat(item.originalPrice)) * item.quantity).toFixed(2)}
                      </span>
                      {parseFloat(item.discountedPrice) < parseFloat(item.originalPrice) && (
                        <span className="text-xs line-through" style={{ color: themeStyles.text.muted }}>
                          ${(parseFloat(item.originalPrice) * item.quantity).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Coupon Code */}
              <motion.div 
                className="mb-6"
                variants={itemVariants}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code"
                    className="flex-1 px-3 py-2 rounded-lg border text-sm transition-all duration-300"
                    style={{
                      backgroundColor: themeStyles.input.backgroundColor,
                      borderColor: themeStyles.input.borderColor,
                      color: themeStyles.input.textColor
                    }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300"
                    style={{ 
                      backgroundColor: themeStyles.button.primary.backgroundColor,
                      color: themeStyles.button.primary.textColor,
                      opacity: couponLoading || !couponCode.trim() ? 0.6 : 1
                    }}
                  >
                    {couponLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>
                {appliedCoupon && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 p-2 rounded-lg bg-green-500 bg-opacity-10"
                  >
                    <p className="text-green-600 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Coupon {appliedCoupon.code} applied! {appliedCoupon.discount_percent}% discount.
                    </p>
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div 
                className="space-y-3 border-t pt-4" 
                style={{ borderColor: themeStyles.card.borderColor }}
                variants={containerVariants}
              >
                <motion.div 
                  className="flex justify-between"
                  variants={itemVariants}
                >
                  <span style={{ color: themeStyles.text.secondary }}>Subtotal</span>
                  <span style={{ color: themeStyles.text.primary }}>${subtotal.toFixed(2)}</span>
                </motion.div>
                
                {appliedCoupon && appliedCoupon.discount_percent > 0 && (
                  <motion.div 
                    className="flex justify-between text-green-600"
                    variants={itemVariants}
                  >
                    <span>Discount ({appliedCoupon.discount_percent}%)</span>
                    <span>-${discount.toFixed(2)}</span>
                  </motion.div>
                )}
                
                <motion.div 
                  className="flex justify-between"
                  variants={itemVariants}
                >
                  <span style={{ color: themeStyles.text.secondary }}>Shipping</span>
                  <span style={{ color: themeStyles.text.primary }}>
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </motion.div>
                <motion.div 
                  className="flex justify-between"
                  variants={itemVariants}
                >
                  <span style={{ color: themeStyles.text.secondary }}>Tax</span>
                  <span style={{ color: themeStyles.text.primary }}>${tax.toFixed(2)}</span>
                </motion.div>
                <motion.div 
                  className="flex justify-between text-xl font-bold border-t pt-3 mt-2" 
                  style={{ borderColor: themeStyles.card.borderColor }}
                  variants={itemVariants}
                >
                  <span style={{ color: themeStyles.text.primary }}>Total</span>
                  <span style={{ color: theme.bg }} className="font-bold">
                    ${finalTotal.toFixed(2)}
                  </span>
                </motion.div>
              </motion.div>

              {/* Trust Badges */}
              <motion.div 
                className="mt-6 pt-6 border-t"
                style={{ borderColor: themeStyles.card.borderColor }}
                variants={itemVariants}
              >
                <div className="flex items-center justify-between text-xs" style={{ color: themeStyles.text.muted }}>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Guaranteed</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Security Badge */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              transition={{ delay: 0.3 }}
              className="rounded-3xl p-6 border text-center backdrop-blur-sm transition-all duration-300"
              style={{
                ...themeStyles.card,
                boxShadow: themeStyles.card.shadow
              }}
            >
              <motion.div 
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: withOpacity(theme.bg, 0.1) }}
                variants={itemVariants}
              >
                <Shield className="w-8 h-8" style={{ color: theme.bg }} />
              </motion.div>
              <motion.p 
                className="text-lg font-semibold mb-2" 
                style={{ color: themeStyles.text.primary }}
                variants={itemVariants}
              >
                Secure Checkout
              </motion.p>
              <motion.p 
                className="text-sm mb-4" 
                style={{ color: themeStyles.text.muted }}
                variants={itemVariants}
              >
                Your payment information is encrypted and secure with bank-level security
              </motion.p>
              <div className="flex justify-center gap-4">
                <div className="w-8 h-5 bg-gray-300 rounded"></div>
                <div className="w-8 h-5 bg-gray-300 rounded"></div>
                <div className="w-8 h-5 bg-gray-300 rounded"></div>
              </div>
            </motion.div>

            {/* Support Info */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              transition={{ delay: 0.4 }}
              className="rounded-3xl p-6 border backdrop-blur-sm transition-all duration-300"
              style={{
                ...themeStyles.card,
                boxShadow: themeStyles.card.shadow
              }}
            >
              <motion.h4 
                className="font-semibold mb-3" 
                style={{ color: themeStyles.text.primary }}
                variants={itemVariants}
              >
                Need Help?
              </motion.h4>
              <motion.div 
                className="space-y-2 text-sm"
                style={{ color: themeStyles.text.secondary }}
                variants={itemVariants}
              >
                <p>📞 Call us: 1-800-123-4567</p>
                <p>💬 Live chat available</p>
                <p>⏰ 24/7 Customer support</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;