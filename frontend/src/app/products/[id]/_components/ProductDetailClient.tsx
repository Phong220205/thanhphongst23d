'use client';

import { useState } from 'react';
import DynamicProductImage from './DynamicProductImage';
import AddToCartButton from './AddToCartButton';

interface ProductVariant {
  id: number;
  productId: number;
  color: string;
  size: string;
  price: number;
  stock: number;
  image: string;
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  brand: string;
  category?: Category;
  variants: ProductVariant[];
}

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const handleVariantChange = (variant: ProductVariant | null) => {
    setSelectedVariant(variant);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
      {/* Cột Ảnh Sản phẩm */}
      <DynamicProductImage
        productName={product.name}
        variants={product.variants}
        selectedVariant={selectedVariant}
      />

      {/* Cột Thông tin & Chọn mua */}
      <div className="flex flex-col">
        <div className="sticky top-24">
          {/* Component client để chọn Size/Màu và hiển thị giá/nút */}
          <AddToCartButton 
            product={product} 
            onVariantChange={handleVariantChange}
          />
        </div>
      </div>
    </div>
  );
}

