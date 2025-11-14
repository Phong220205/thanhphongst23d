'use client';

import { useState, useEffect } from 'react';
import ProductImage from './ProductImage';

interface ProductVariant {
  id: number;
  productId: number;
  color: string;
  size: string;
  price: number;
  stock: number;
  image: string;
}

interface DynamicProductImageProps {
  productName: string;
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
}

export default function DynamicProductImage({ 
  productName, 
  variants, 
  selectedVariant 
}: DynamicProductImageProps) {
  const [currentImage, setCurrentImage] = useState<string>(
    variants[0]?.image || '/placeholder-image.jpg'
  );

  useEffect(() => {
    if (selectedVariant?.image) {
      setCurrentImage(selectedVariant.image);
    } else if (variants.length > 0) {
      // Fallback to first variant image if no variant selected
      setCurrentImage(variants[0].image || '/placeholder-image.jpg');
    }
  }, [selectedVariant, variants]);

  return (
    <div className="relative group">
      <div className="aspect-h-4 aspect-w-3 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl border border-gray-700/50 transition-all duration-300">
        <ProductImage
          src={currentImage}
          alt={productName}
          width={800}
          height={1000}
          className="h-full w-full object-cover transition-opacity duration-300"
          priority
        />
      </div>
      <div className="absolute top-4 right-4 bg-purple-600/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
        {variants.length} biến thể
      </div>
    </div>
  );
}

