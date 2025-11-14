'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ordersAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  productVariant: {
    id: number;
    color: string;
    size: string;
    image: string;
    product: {
      id: number;
      name: string;
      brand: string;
    };
  };
}

interface Order {
  id: number;
  total: string;
  status: string;
  paymentMethod: string;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
}

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: { [key: string]: string } = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đã giao hàng',
  delivered: 'Đã nhận hàng',
  cancelled: 'Đã hủy',
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await ordersAPI.getMyOrders();
        if (response.status === 'success') {
          setOrders(response.data);
        }
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        toast.error('Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numPrice);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <p className="text-lg text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Đơn hàng của tôi</h1>
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 mb-4">Bạn chưa có đơn hàng nào</p>
          <Link
            href="/products"
            className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
          >
            Bắt đầu mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Đơn hàng của tôi</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Đơn hàng #{order.id}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Đặt ngày: {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="mt-2 sm:mt-0 flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusLabels[order.status] || order.status}
                </span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="mb-4 text-sm text-gray-600">
                <strong>Địa chỉ giao hàng:</strong> {order.shippingAddress}
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Sản phẩm:</h4>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={item.productVariant.image || '/placeholder-image.jpg'}
                        alt={item.productVariant.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.productVariant.product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.productVariant.product.brand} - {item.productVariant.color} - {item.productVariant.size}
                      </p>
                      <p className="text-sm text-gray-600">
                        Số lượng: {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(parseFloat(item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Link
                href={`/orders/${order.id}`}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Xem chi tiết →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

