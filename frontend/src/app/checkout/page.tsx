'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ordersAPI, paymentAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

const shippingOptions: ShippingOption[] = [
  { id: 'standard', name: 'Giao hàng tiêu chuẩn', price: 30000, estimatedDays: '5-7 ngày' },
  { id: 'express', name: 'Giao hàng nhanh', price: 50000, estimatedDays: '2-3 ngày' },
];

const getAxiosMessage = (error: unknown, fallback = 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.') => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCartStore();
  const { isAuthenticated, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [selectedShipping, setSelectedShipping] = useState<string>('standard');
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    shippingAddress: '',
    paymentMethod: 'cod',
  });

  // Handle redirects in useEffect to avoid render-time side effects
  useEffect(() => {
    // Don't redirect if order is being completed
    if (isOrderComplete) {
      return;
    }
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      router.push('/cart');
      return;
    }
  }, [isAuthenticated, items.length, router, isOrderComplete]);

  // Early return if not authenticated or cart is empty (but allow order completion)
  if (!isAuthenticated) {
    return null;
  }
  
  if (items.length === 0 && !isOrderComplete) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const selectedShippingOption = shippingOptions.find(opt => opt.id === selectedShipping) || shippingOptions[0];
  const subtotal = getCartTotal();
  const shippingCost = selectedShippingOption.price;
  const discount = discountAmount;
  const total = subtotal + shippingCost - discount;

  const handleApplyDiscount = () => {
    // Mock discount logic - in real app, this would call an API
    if (discountCode.toUpperCase() === 'SAVE10') {
      setDiscountAmount(subtotal * 0.1);
      setDiscountApplied(true);
      toast.success('Mã giảm giá đã được áp dụng!');
    } else if (discountCode.toUpperCase() === 'WELCOME20') {
      setDiscountAmount(subtotal * 0.2);
      setDiscountApplied(true);
      toast.success('Mã giảm giá đã được áp dụng!');
    } else {
      toast.error('Mã giảm giá không hợp lệ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }
    if (!formData.shippingAddress.trim()) {
      toast.error('Vui lòng nhập địa chỉ giao hàng');
      return;
    }

    // Check if user is authenticated and has a valid token
    if (!isAuthenticated || !token) {
      toast.error('Vui lòng đăng nhập để đặt hàng', {
        duration: 3000,
      });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      return;
    }
    
    // Verify token is still valid by checking localStorage
    const authData = localStorage.getItem('clothing-store-auth');
    if (!authData) {
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', {
        duration: 3000,
      });
      const { logout } = useAuthStore.getState();
      logout();
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      return;
    }

    // Double-check token before making request
    const currentToken = token || useAuthStore.getState().token;
    if (!currentToken) {
      // Try to get from localStorage as last resort
      const authData = localStorage.getItem('clothing-store-auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const storedToken = parsed.state?.token || parsed.token;
          if (!storedToken) {
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', {
              duration: 3000,
            });
            const { logout } = useAuthStore.getState();
            logout();
            setTimeout(() => {
              router.push('/login');
            }, 2000);
            return;
          }
        } catch (e) {
          console.error('Error parsing auth data:', e);
        }
      } else {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', {
          duration: 3000,
        });
        const { logout } = useAuthStore.getState();
        logout();
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        })),
        paymentMethod: formData.paymentMethod,
        shippingAddress: `${formData.shippingAddress} | ${formData.fullName} | ${formData.phoneNumber} | ${formData.email}`,
      };

      console.log('[Checkout] Submitting order with data:', {
        itemsCount: orderData.items.length,
        paymentMethod: orderData.paymentMethod,
        hasToken: !!currentToken,
        tokenPreview: currentToken ? currentToken.substring(0, 20) + '...' : 'NO TOKEN',
      });

      // Final check - if no token, don't even try
      if (!currentToken) {
        const authData = localStorage.getItem('clothing-store-auth');
        console.error('[Checkout] No token available. Auth data:', authData ? 'exists' : 'missing');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', {
          duration: 3000,
        });
        const { logout } = useAuthStore.getState();
        logout();
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      const response = await ordersAPI.create(orderData);
      
      // Handle different response formats
      const orderId = response.data?.id || response.id || response.orderId;
      const isSuccess = response.status === 'success' || response.success || orderId;

      if (isSuccess && orderId) {
        // If Stripe payment, redirect to Stripe checkout
        if (formData.paymentMethod === 'stripe') {
          try {
            await paymentAPI.createIntent({
              orderId: orderId,
              amount: total
            });
            setIsOrderComplete(true); // Prevent redirect from useEffect
            clearCart();
            toast.success('Đặt hàng thành công!');
            router.push(`/checkout/stripe?orderId=${orderId}&amount=${total}`);
            return;
          } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 503) {
              toast.error('Thanh toán Stripe chưa được cấu hình. Vui lòng chọn phương thức thanh toán khác.');
              return;
            }
            throw error;
          }
        }

        // For other payment methods, show success and redirect to success page
        setIsOrderComplete(true); // Prevent redirect from useEffect
        clearCart();
        toast.success('Đặt hàng thành công!', {
          duration: 2000,
        });
        // Redirect to success page
        setTimeout(() => {
          router.push(`/checkout/success?orderId=${orderId}`);
        }, 1000);
      } else {
        throw new Error('Không thể tạo đơn hàng. Vui lòng thử lại.');
      }
    } catch (error) {
      const axiosError = axios.isAxiosError(error) ? error : null;
      console.error('Error creating order:', error);
      if (axiosError) {
        console.error('Full error details:', {
          status: axiosError.response?.status,
          message: axiosError.response?.data?.message,
          details: axiosError.response?.data?.details,
          error: axiosError.message
        });
      }
      
      // Handle specific error cases
      if (axiosError?.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', {
          duration: 3000,
        });
        // Clear auth and redirect to login after a short delay to show the message
        const { logout } = useAuthStore.getState();
        logout();
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return; // Important: return early to prevent further execution
      } else if (axiosError?.response?.status === 400) {
        const errorMessage = axiosError.response?.data?.message || 'Thông tin đơn hàng không hợp lệ';
        toast.error(errorMessage);
      } else if (error instanceof Error && error.message === 'Authentication required. Please log in again.') {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', {
          duration: 3000,
        });
        const { logout } = useAuthStore.getState();
        logout();
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      } else if (axiosError?.response?.status === 500) {
        // Database or server error
        const errorMessage = axiosError.response?.data?.message || 'Lỗi cơ sở dữ liệu. Vui lòng thử lại.';
        const details = axiosError.response?.data?.details;
        toast.error(details ? `${errorMessage}: ${details}` : errorMessage, {
          duration: 5000,
        });
      } else {
        const errorMessage = getAxiosMessage(error);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Thanh toán</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">
                Giỏ hàng của bạn
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.variant.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        src={item.variant.image || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                        onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{item.product.name}</h3>
                      <div className="flex gap-3 text-sm text-gray-600 mb-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">
                          Màu: {item.variant.color}
                        </span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-medium">
                          Size: {item.variant.size}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Số lượng: {item.quantity}</span>
                        <span className="font-bold text-lg text-indigo-600">
                          {formatPrice(item.variant.price * item.quantity)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatPrice(item.variant.price)} / sản phẩm
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount Code */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Mã giảm giá</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Nhập mã giảm giá"
                  className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                  disabled={discountApplied}
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={discountApplied || !discountCode.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {discountApplied ? 'Đã áp dụng' : 'Áp dụng'}
                </button>
              </div>
              {discountApplied && (
                <p className="mt-3 text-sm text-green-600 font-medium">
                  ✓ Mã giảm giá đã được áp dụng: -{formatPrice(discountAmount)}
                </p>
              )}
            </div>

            {/* Customer Information Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">
                Thông tin khách hàng
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="Nhập địa chỉ email"
                  required
                />
              </div>

              <div>
                <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ giao hàng *
                </label>
                <textarea
                  id="shippingAddress"
                  rows={4}
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                  placeholder="Nhập địa chỉ giao hàng đầy đủ..."
                  required
                />
              </div>

              {/* Shipping Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Phương thức vận chuyển
                </label>
                <div className="space-y-3">
                  {shippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedShipping === option.id
                          ? 'border-indigo-400 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={option.id}
                        checked={selectedShipping === option.id}
                        onChange={(e) => setSelectedShipping(e.target.value)}
                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-gray-800">{option.name}</span>
                            <span className="ml-2 text-sm text-gray-500">({option.estimatedDays})</span>
                          </div>
                          <span className="font-bold text-indigo-600">{formatPrice(option.price)}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Phương thức thanh toán
                </label>
                <div className="space-y-3">
                  <label
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === 'cod'
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                    />
                    <div className="ml-4 flex-1">
                      <span className="font-semibold text-gray-800">Thanh toán khi nhận hàng (COD)</span>
                      <p className="text-sm text-gray-500 mt-1">Thanh toán bằng tiền mặt khi nhận hàng</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === 'stripe'
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={formData.paymentMethod === 'stripe'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                    />
                    <div className="ml-4 flex-1">
                      <span className="font-semibold text-gray-800">Thẻ tín dụng / Ghi nợ</span>
                      <p className="text-sm text-gray-500 mt-1">Thanh toán an toàn qua Stripe</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === 'ewallet'
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ewallet"
                      checked={formData.paymentMethod === 'ewallet'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                    />
                    <div className="ml-4 flex-1">
                      <span className="font-semibold text-gray-800">Ví điện tử</span>
                      <p className="text-sm text-gray-500 mt-1">Momo, ZaloPay, VNPay</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  'Đặt hàng ngay'
                )}
              </button>
            </form>
          </div>

          {/* Order Summary - Fixed on Right */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">
                Tóm tắt đơn hàng
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-medium">{formatPrice(shippingCost)}</span>
                </div>
                
                {discountApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{formatPrice(discount)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Tổng cộng:</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 space-y-2">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Miễn phí đổi trả trong 30 ngày
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Bảo hành chính hãng
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Giao hàng toàn quốc
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
