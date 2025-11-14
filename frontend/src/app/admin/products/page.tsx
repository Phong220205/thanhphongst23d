'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface ProductVariant {
  id?: number;
  color: string;
  size: string;
  price: number;
  stock: number;
  image: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  brand: string;
  categoryId: number;
  variants: ProductVariant[];
  category?: { id: number; name: string };
}

interface Category {
  id: number;
  name: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    categoryId: '',
    variants: [{ color: '', size: '', price: '', stock: '', image: '' }] as Array<{
      color: string;
      size: string;
      price: string;
      stock: string;
      image: string;
    }>
  });

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
    fetchProducts();
    fetchCategories();
  }, [isAuthenticated, user, router]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ limit: 100 });
      if (response.status === 'success') {
        setProducts(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.status === 'success') {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const variants = formData.variants
        .filter(v => v.color && v.size && v.price && v.stock)
        .map(v => ({
          color: v.color,
          size: v.size,
          price: parseFloat(v.price),
          stock: parseInt(v.stock),
          image: v.image || ''
        }));

      const productData = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        categoryId: parseInt(formData.categoryId),
        variants
      };

      if (editingProduct) {
        // Update product
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('clothing-store-auth') ? JSON.parse(localStorage.getItem('clothing-store-auth')!).state.token : ''}`
          },
          body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error('Cập nhật thất bại');
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        // Create product
        const response = await productsAPI.create(productData as any);
        if (response.status === 'success') {
          toast.success('Tạo sản phẩm thành công');
        }
      }

      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clothing-store-auth') ? JSON.parse(localStorage.getItem('clothing-store-auth')!).state.token : ''}`
        }
      });

      if (!response.ok) throw new Error('Xóa thất bại');
      toast.success('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      brand: product.brand || '',
      categoryId: product.categoryId.toString(),
      variants: product.variants.length > 0
        ? product.variants.map(v => ({
            color: v.color || '',
            size: v.size || '',
            price: v.price.toString(),
            stock: v.stock.toString(),
            image: v.image || ''
          }))
        : [{ color: '', size: '', price: '', stock: '', image: '' }]
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      brand: '',
      categoryId: '',
      variants: [{ color: '', size: '', price: '', stock: '', image: '' }]
    });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { color: '', size: '', price: '', stock: '', image: '' }]
    });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index)
    });
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Chọn danh mục</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Biến thể sản phẩm *</label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  + Thêm biến thể
                </button>
              </div>
              {formData.variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Màu"
                    value={variant.color}
                    onChange={(e) => updateVariant(index, 'color', e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-1"
                  />
                  <input
                    type="text"
                    placeholder="Size"
                    value={variant.size}
                    onChange={(e) => updateVariant(index, 'size', e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-1"
                  />
                  <input
                    type="number"
                    placeholder="Giá"
                    value={variant.price}
                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-1"
                  />
                  <input
                    type="number"
                    placeholder="Tồn kho"
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-1"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL ảnh"
                      value={variant.image}
                      onChange={(e) => updateVariant(index, 'image', e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1"
                    />
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                {editingProduct ? 'Cập nhật' : 'Tạo mới'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thương hiệu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biến thể</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{product.brand || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{product.category?.name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{product.variants?.length || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

