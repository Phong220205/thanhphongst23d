'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { categoriesAPI, ordersAPI, productsAPI, ProductPayload } from '@/lib/api';

type AdminOrder = {
  id: number;
  status: string;
  total: string;
  createdAt: string;
  paymentMethod: string;
  user?: { id: number; name: string; email: string };
  items: { id: number; quantity: number; price: string }[];
};

type ProductRow = {
  id: number;
  name: string;
  brand?: string;
  description?: string;
  categoryId: number;
  category?: { id: number; name: string };
  variants: Array<{
    id?: number;
    color: string;
    size: string;
    price: number;
    stock: number;
    image?: string;
  }>;
};

type ProductVariantForm = {
  color: string;
  size: string;
  price: string;
  stock: string;
  image: string;
};

const orderStatusOptions = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'processing', label: 'Đang chuẩn bị' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const emptyProductForm: ProductPayload & { variants: ProductVariantForm[] } = {
  name: '',
  description: '',
  brand: '',
  categoryId: 0,
  variants: [{ color: '', size: '', price: '', stock: '', image: '' }],
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [orderFilter, setOrderFilter] = useState('');
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập');
      router.push('/');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [ordersRes, productsRes, categoriesRes] = await Promise.all([
          ordersAPI.getAll({ limit: 100 }),
          productsAPI.getAll({ limit: 100 }),
          categoriesAPI.getAll(),
        ]);

        if (ordersRes.status === 'success') {
          setOrders(ordersRes.data);
        }
        if (productsRes.status === 'success') {
          setProducts(productsRes.data);
        }
        if (categoriesRes.status === 'success') {
          setCategories(categoriesRes.data);
        }
      } catch (error) {
        console.error('Error loading admin data', error);
        toast.error('Không thể tải dữ liệu quản trị');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, router, user]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const customers = new Set(orders.map((order) => order.user?.email)).size;
    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      totalProducts: products.length,
      customers,
    };
  }, [orders, products]);

  const filteredOrders = useMemo(() => {
    if (!orderFilter) return orders;
    return orders.filter((order) => order.status === orderFilter);
  }, [orders, orderFilter]);

  const handleOrderStatusChange = async (orderId: number, status: string) => {
    try {
      setUpdatingOrderId(orderId);
      await ordersAPI.updateStatus(orderId, status);
      toast.success('Cập nhật trạng thái đơn hàng thành công');
      const refreshed = await ordersAPI.getAll({ limit: 100 });
      if (refreshed.status === 'success') {
        setOrders(refreshed.data);
      }
    } catch (error) {
      console.error('Error updating order status', error);
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleProductInput = (field: keyof ProductPayload, value: string) => {
    setProductForm((prev) => ({
      ...prev,
      [field]: field === 'categoryId' ? Number(value) : value,
    }));
  };

  const handleVariantChange = (index: number, key: keyof ProductVariantForm, value: string) => {
    setProductForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [key]: value };
      return { ...prev, variants };
    });
  };

  const addVariantRow = () => {
    setProductForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { color: '', size: '', price: '', stock: '', image: '' }],
    }));
  };

  const removeVariantRow = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
  };

  const handleEditProduct = (product: ProductRow) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description || '',
      brand: product.brand || '',
      categoryId: product.categoryId,
      variants: product.variants.map((variant) => ({
        color: variant.color || '',
        size: variant.size || '',
        price: String(variant.price || ''),
        stock: String(variant.stock || ''),
        image: variant.image || '',
      })),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Đã xóa sản phẩm');
      const refreshed = await productsAPI.getAll({ limit: 100 });
      if (refreshed.status === 'success') {
        setProducts(refreshed.data);
      }
    } catch (error) {
      console.error('Delete product error', error);
      toast.error('Không thể xóa sản phẩm');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.categoryId) {
      toast.error('Vui lòng nhập đầy đủ thông tin sản phẩm');
      return;
    }

    const cleanedVariants = productForm.variants
      .filter((variant) => variant.color && variant.size && variant.price && variant.stock)
      .map((variant) => ({
        color: variant.color,
        size: variant.size,
        price: Number(variant.price),
        stock: Number(variant.stock),
        image: variant.image,
      }));

    if (cleanedVariants.length === 0) {
      toast.error('Cần ít nhất một biến thể sản phẩm');
      return;
    }

    const payload: ProductPayload = {
      name: productForm.name,
      description: productForm.description,
      brand: productForm.brand,
      categoryId: productForm.categoryId,
      variants: cleanedVariants,
    };

    try {
      setSavingProduct(true);
      if (editingProductId) {
        await productsAPI.update(editingProductId, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await productsAPI.create(payload);
        toast.success('Tạo sản phẩm mới thành công');
      }
      const refreshed = await productsAPI.getAll({ limit: 100 });
      if (refreshed.status === 'success') {
        setProducts(refreshed.data);
      }
      resetProductForm();
    } catch (error) {
      console.error('Save product error', error);
      toast.error('Không thể lưu sản phẩm');
    } finally {
      setSavingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-500">Đang tải dữ liệu quản trị...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">Admin control</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">Xin chào, {user?.name || 'Admin'}</h1>
            <p className="text-gray-500 mt-1">Quản lý đơn hàng, sản phẩm và khách hàng tại đây</p>
          </div>
          <button
            onClick={() => router.push('/admin/products')}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Đến trang quản lý chi tiết
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Tổng doanh thu</p>
            <p className="mt-3 text-2xl font-bold text-indigo-600">
              {stats.totalRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Đơn hàng</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            <p className="text-sm text-amber-500">{stats.pendingOrders} đơn đang chờ</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Sản phẩm</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Khách hàng</p>
            <p className="mt-3 text-2xl font-bold text-gray-900">{stats.customers || 0}</p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Tạo / chỉnh sửa sản phẩm</h2>
              <p className="text-sm text-gray-500">Thêm nhanh sản phẩm với các biến thể khác nhau</p>
            </div>
            <form className="space-y-4" onSubmit={handleSaveProduct}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => handleProductInput('name', e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Thương hiệu</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => handleProductInput('brand', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => handleProductInput('description', e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Danh mục</label>
                <select
                  value={productForm.categoryId || ''}
                  onChange={(e) => handleProductInput('categoryId', e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Biến thể sản phẩm</label>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    + Thêm biến thể
                  </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {productForm.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-5"
                    >
                      <input
                        type="text"
                        placeholder="Màu"
                        value={variant.color}
                        onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Size"
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Giá"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Tồn kho"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Ảnh"
                          value={variant.image}
                          onChange={(e) => handleVariantChange(index, 'image', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                        {productForm.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariantRow(index)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingProduct ? 'Đang lưu...' : editingProductId ? 'Cập nhật sản phẩm' : 'Tạo mới'}
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Đơn hàng gần đây</h2>
                <p className="text-sm text-gray-500">Theo dõi và cập nhật trạng thái</p>
              </div>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Tất cả</option>
                {orderStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-2">
              {filteredOrders.length === 0 ? (
                <p className="text-sm text-gray-500">Không có đơn hàng phù hợp</p>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Đơn #{order.id}</p>
                        <p className="text-lg font-semibold text-gray-900">{order.user?.name || 'Khách hàng'}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {Number(order.total).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </p>
                        <p className="text-xs text-gray-500">Thanh toán: {order.paymentMethod?.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">{order.items.length} sản phẩm</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                        disabled={updatingOrderId === order.id}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        {orderStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Danh sách sản phẩm</h2>
            <p className="text-sm text-gray-500">Nhấn &quot;Chỉnh sửa&quot; để nạp dữ liệu vào form phía trên</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 text-left">Sản phẩm</th>
                  <th className="px-3 py-2 text-left">Danh mục</th>
                  <th className="px-3 py-2 text-left">Biến thể</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.brand}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{product.category?.name || 'N/A'}</td>
                    <td className="px-3 py-3 text-gray-600">
                      {product.variants.map((variant) => (
                        <span
                          key={`${product.id}-${variant.color}-${variant.size}`}
                          className="mr-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {variant.color}/{variant.size} ({variant.stock})
                        </span>
                      ))}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-3 text-sm">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-indigo-600 hover:underline"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-500 hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

