'use client';

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { toast } from "react-hot-toast";

// --- Định nghĩa kiểu dữ liệu (Phải khớp với page.tsx) ---
interface ProductVariant {
  id: number;
  productId: number;
  color: string;
  size: string;
  price: number;
  stock: number;
  image: string;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  variants: ProductVariant[];
  // Thêm các trường khác nếu cần
}

interface ProductCardProps {
  product: Product;
}

// --- Component ---
export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  // Kiểm tra xem product và variants có tồn tại không
  if (!product || !product.variants || product.variants.length === 0) {
    console.warn(`ProductCard: Product or variants missing for product ID ${product?.id}`);
    return null; // Không hiển thị card nếu thiếu dữ liệu cơ bản
  }

  const defaultVariant = product.variants[0];

  // Hàm xử lý khi nhấn nút Thêm vào giỏ
  const handleAddToCart = () => {
    // Lấy thông tin cơ bản của product
    const productInfo = {
      id: product.id,
      name: product.name,
      brand: product.brand,
    };

    // Gọi action thêm vào giỏ hàng từ store
    addItem(productInfo, defaultVariant, 1);
    toast.success(`${product.name} (${defaultVariant.size}/${defaultVariant.color}) đã được thêm vào giỏ!`);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link href={`/products/${product.id}`} className="block">
        <div className="aspect-h-4 aspect-w-3 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 relative">
          <Image
            src={defaultVariant.image || '/placeholder-image.jpg'}
            alt={product.name}
            width={400}
            height={500}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { e.currentTarget.src = '/placeholder-image.jpg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {defaultVariant.stock === 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              Hết hàng
            </div>
          )}
        </div>
        <div className="p-5">
          {product.brand && (
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {product.brand}
            </p>
          )}
          <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(defaultVariant.price)}
            </p>
          </div>
        </div>
      </Link>

      {/* Nút thêm vào giỏ */}
      <div className="px-5 pb-5">
        <button
          onClick={handleAddToCart}
          disabled={!defaultVariant || defaultVariant.stock === 0}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-400 disabled:hover:scale-100"
        >
          {defaultVariant && defaultVariant.stock > 0 ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Thêm vào giỏ
            </span>
          ) : (
            'Hết hàng'
          )}
        </button>
      </div>
    </div>
  );
}