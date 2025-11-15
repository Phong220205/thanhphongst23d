'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getById(parseInt(orderId));
        if (response.status === 'success') {
          setOrder(response.data);
        } else {
          toast.error('Không tìm thấy đơn hàng');
          router.push('/orders');
        }
      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast.error('Không thể tải thông tin đơn hàng');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, isAuthenticated, router]);

  if (!isAuthenticated || !order) {
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

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/orders"
        className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
      >
        ← Quay lại danh sách đơn hàng
      </Link>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Đơn hàng #{order.id}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Đặt ngày: {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="mt-2 sm:mt-0">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {statusLabels[order.status] || order.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thông tin thanh toán</h3>
            <p className="text-sm text-gray-600">
              Phương thức: {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Tổng tiền: <span className="font-bold text-indigo-600">{formatPrice(order.total)}</span>
            </p>
          </div>
          {order.shippingAddress && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Địa chỉ giao hàng</h3>
              <p className="text-sm text-gray-600">{order.shippingAddress}</p>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết sản phẩm</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
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
                  <p className="text-sm text-gray-600 mt-1">
                    Số lượng: {item.quantity} x {formatPrice(item.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatPrice(parseFloat(item.price) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end border-t pt-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Tổng cộng:</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {formatPrice(order.total)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

