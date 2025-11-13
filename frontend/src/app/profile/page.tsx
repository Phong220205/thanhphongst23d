'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ordersAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchRecentOrders();
  }, [isAuthenticated, router]);

  const fetchRecentOrders = async () => {
    try {
      const response = await ordersAPI.getMyOrders({ limit: 5 });
      if (response.status === 'success') {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Thông tin tài khoản</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Thông tin cá nhân</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Họ và tên</p>
                <p className="text-base font-medium text-gray-900">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vai trò</p>
                <p className="text-base font-medium text-gray-900">
                  {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                </p>
              </div>
            </div>
            {user.role === 'admin' && (
              <div className="mt-6 pt-6 border-t">
                <Link
                  href="/admin/products"
                  className="block w-full text-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Quản lý sản phẩm
                </Link>
              </div>
            )}
            <div className="mt-4">
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                  toast.success('Đã đăng xuất');
                }}
                className="w-full text-center rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Đơn hàng gần đây</h2>
              <Link
                href="/orders"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Xem tất cả →
              </Link>
            </div>
            {loading ? (
              <p className="text-gray-500">Đang tải...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào</p>
                <Link
                  href="/products"
                  className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
                >
                  Bắt đầu mua sắm
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">Đơn hàng #{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-indigo-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(parseFloat(order.total))}
                        </p>
                        <p className="text-sm text-gray-500">{order.status}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

