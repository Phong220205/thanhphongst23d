'use client';

import { useCartStore, CartItem } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getCartTotal, getTotalItems, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thanh toán');
      router.push('/login');
      return;
    }
    if (items.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống');
      return;
    }
    router.push('/checkout');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Giỏ hàng của bạn</h1>
          <p className="text-lg text-gray-500 mb-8">Giỏ hàng của bạn đang trống</p>
          <Link
            href="/products"
            className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng của bạn</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item: CartItem) => (
              <div
                key={item.variant.id}
                className="flex flex-col sm:flex-row gap-4 rounded-lg border bg-white p-4 shadow-sm"
              >
                <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={item.variant.image || '/placeholder-image.jpg'}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.product.brand} - {item.variant.color} - {item.variant.size}
                  </p>
                  <p className="mt-2 text-lg font-bold text-indigo-600">
                    {formatPrice(item.variant.price)}
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                        className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                        disabled={item.quantity >= item.variant.stock}
                        className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        removeItem(item.variant.id);
                        toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(item.variant.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số lượng sản phẩm:</span>
                <span className="font-medium">{getTotalItems()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="font-medium">{formatPrice(getCartTotal())}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-indigo-600">{formatPrice(getCartTotal())}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full rounded-md bg-indigo-600 px-4 py-3 text-base font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Thanh toán
            </button>
            <Link
              href="/products"
              className="mt-3 block w-full text-center rounded-md border border-gray-300 px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
