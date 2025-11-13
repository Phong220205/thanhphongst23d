'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ordersAPI, paymentAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shippingAddress: '',
    paymentMethod: 'cod',
  });

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.shippingAddress.trim()) {
      toast.error('Vui lòng nhập địa chỉ giao hàng');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        })),
        paymentMethod: formData.paymentMethod,
        shippingAddress: formData.shippingAddress,
      };

      const response = await ordersAPI.create(orderData);
      
      if (response.status === 'success') {
        // If Stripe payment, redirect to Stripe checkout
        if (formData.paymentMethod === 'stripe') {
          try {
            // Try to create payment intent first to check if Stripe is configured
            await paymentAPI.createIntent({
              orderId: response.data.id,
              amount: getCartTotal()
            });
            clearCart();
            router.push(`/checkout/stripe?orderId=${response.data.id}&amount=${getCartTotal()}`);
            return;
          } catch (error: any) {
            // If Stripe is not configured, fall back to COD
            if (error.response?.status === 503) {
              toast.error('Thanh toán Stripe chưa được cấu hình. Vui lòng chọn phương thức thanh toán khác.');
              return;
            }
            throw error;
          }
        }

        // For other payment methods, go to order page
        toast.success('Đặt hàng thành công!');
        clearCart();
        router.push(`/orders/${response.data.id}`);
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
            <div>
              <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ giao hàng *
              </label>
              <textarea
                id="shippingAddress"
                rows={4}
                value={formData.shippingAddress}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Nhập địa chỉ giao hàng đầy đủ..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phương thức thanh toán
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="mr-2"
                  />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={formData.paymentMethod === 'stripe'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="mr-2"
                  />
                  <span>Thanh toán bằng thẻ (Stripe)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={formData.paymentMethod === 'bank'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="mr-2"
                  />
                  <span>Chuyển khoản ngân hàng</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-600 px-4 py-3 text-base font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.variant.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.product.name} x {item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.variant.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-indigo-600">{formatPrice(getCartTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

