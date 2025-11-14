'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { categoriesAPI } from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

function ProductsFilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (categoryId) params.set('category', categoryId);
    router.push(`/products?${params.toString()}`);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategoryId = e.target.value;
    setCategoryId(newCategoryId);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (newCategoryId) params.set('category', newCategoryId);
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    router.push('/products');
  };

  return (
    <div className="mb-8 bg-white p-4 rounded-lg border shadow-sm">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={categoryId}
            onChange={handleCategoryChange}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 whitespace-nowrap"
          >
            Tìm kiếm
          </button>
          {(search || categoryId) && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export function ProductsFilter() {
  return (
    <Suspense fallback={
      <div className="mb-8 bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="sm:w-48 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    }>
      <ProductsFilterContent />
    </Suspense>
  );
}

