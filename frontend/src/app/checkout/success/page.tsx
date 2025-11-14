'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ordersAPI } from '@/lib/api';
import Link from 'next/link';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      router.push('/orders');
    }
  }, [orderId, router]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getById(parseInt(orderId!));
      if (response.status === 'success') {
        setOrder(response.data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <p className="text-lg text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thanh toán thành công!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Cảm ơn bạn đã mua sắm. Đơn hàng của bạn đã được xác nhận.
        </p>
        {order && (
          <div className="bg-white rounded-lg border p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold mb-4">Thông tin đơn hàng</h2>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Mã đơn hàng:</span> #{order.id}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Tổng tiền:</span>{' '}
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(parseFloat(order.total))}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Trạng thái:</span> {order.status}
            </p>
          </div>
        )}
        <div className="flex gap-4 justify-center">
          <Link
            href={`/orders/${orderId}`}
            className="rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
          >
            Xem đơn hàng
          </Link>
          <Link
            href="/products"
            className="rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <p className="text-lg text-gray-500">Đang tải...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

