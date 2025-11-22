'use client'; // Client component

import { useState, useEffect, useMemo } from 'react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'react-hot-toast';

// --- Định nghĩa kiểu dữ liệu ---
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
}

interface Props {
    product: Product;
    onVariantChange?: (variant: ProductVariant | null) => void;
}

export default function AddToCartButton({ product, onVariantChange }: Props) {
    const addItem = useCartStore((state) => state.addItem);

    // Lấy variant mặc định (variant đầu tiên)
    const initialVariant = product.variants?.[0] || null;

    // State để lưu trữ size và màu đang được chọn
    const [selectedSize, setSelectedSize] = useState<string | null>(initialVariant?.size || null);
    const [selectedColor, setSelectedColor] = useState<string | null>(initialVariant?.color || null);
    const [quantity, setQuantity] = useState(1);

    // Lấy danh sách size và màu duy nhất từ các biến thể
    const uniqueSizes = Array.from(new Set(product.variants.map(v => v.size))).filter(Boolean);
    
    // Lấy danh sách màu khả dụng cho size đã chọn (hoặc tất cả màu nếu chưa chọn size)
    const getAvailableColors = () => {
        if (selectedSize) {
            // Chỉ lấy màu có sẵn cho size đã chọn (case-insensitive, trim whitespace)
            const colorsForSize = product.variants
                .filter(v => {
                    const variantSize = String(v.size || '').trim();
                    const selectedSizeTrimmed = String(selectedSize || '').trim();
                    return variantSize === selectedSizeTrimmed;
                })
                .map(v => String(v.color || '').trim())
                .filter(Boolean);
            
            // Remove duplicates and return
            return Array.from(new Set(colorsForSize));
        }
        // Nếu chưa chọn size, lấy tất cả màu
        const allColors = product.variants
            .map(v => String(v.color || '').trim())
            .filter(Boolean);
        return Array.from(new Set(allColors));
    };
    const availableColors = getAvailableColors();

    const currentVariant = useMemo(() => {
        if (!selectedSize || !selectedColor) return null;
        const selectedSizeTrimmed = String(selectedSize).trim();
        const selectedColorTrimmed = String(selectedColor).trim();
        return product.variants.find(v => {
            const variantSize = String(v.size || '').trim();
            const variantColor = String(v.color || '').trim();
            return variantSize === selectedSizeTrimmed && variantColor === selectedColorTrimmed;
        }) || null;
    }, [selectedSize, selectedColor, product.variants]);

    useEffect(() => {
        if (onVariantChange) {
            onVariantChange(currentVariant);
        }
    }, [currentVariant, onVariantChange]);

    // Hàm xử lý khi chọn size/màu (tự động cập nhật lựa chọn còn lại nếu cần)
    const handleSizeChange = (size: string) => {
        const sizeTrimmed = String(size || '').trim();
        setSelectedSize(sizeTrimmed);
        setQuantity(1);
        // Kiểm tra xem màu hiện tại có khả dụng với size mới không
        const isColorAvailable = product.variants.some(v => {
            const variantSize = String(v.size || '').trim();
            const variantColor = String(v.color || '').trim();
            const selectedColorTrimmed = String(selectedColor || '').trim();
            return variantSize === sizeTrimmed && variantColor === selectedColorTrimmed && v.stock > 0;
        });
        // Nếu không, chọn màu đầu tiên có sẵn cho size mới đó
        if (!isColorAvailable) {
            const firstAvailableVariant = product.variants.find(v => {
                const variantSize = String(v.size || '').trim();
                return variantSize === sizeTrimmed && v.stock > 0;
            });
            if (firstAvailableVariant) {
                setSelectedColor(String(firstAvailableVariant.color || '').trim());
            } else {
                setSelectedColor(null);
            }
        }
    };
    
    const handleColorChange = (color: string) => {
         const colorTrimmed = String(color || '').trim();
         setSelectedColor(colorTrimmed);
         setQuantity(1);
         // Kiểm tra xem size hiện tại có khả dụng với màu mới không
         const isSizeAvailable = product.variants.some(v => {
             const variantSize = String(v.size || '').trim();
             const variantColor = String(v.color || '').trim();
             const selectedSizeTrimmed = String(selectedSize || '').trim();
             return variantColor === colorTrimmed && variantSize === selectedSizeTrimmed && v.stock > 0;
         });
         // Nếu không, chọn size đầu tiên có sẵn cho màu mới đó
         if (!isSizeAvailable) {
             const firstAvailableVariant = product.variants.find(v => {
                 const variantColor = String(v.color || '').trim();
                 return variantColor === colorTrimmed && v.stock > 0;
             });
             if (firstAvailableVariant) {
                 setSelectedSize(String(firstAvailableVariant.size || '').trim());
             } else {
                 setSelectedSize(null);
             }
         }
    };

    const handleAddToCart = () => {
        if (!currentVariant) {
            toast.error("Vui lòng chọn đầy đủ size và màu.");
            return;
        }
        if (quantity > currentVariant.stock) {
            toast.error(`Số lượng tồn kho chỉ còn ${currentVariant.stock}.`);
            return;
        }
         if (quantity <= 0) {
            toast.error("Số lượng phải lớn hơn 0.");
            return;
        }

        const productInfo = { id: product.id, name: product.name, brand: product.brand };
        addItem(productInfo, currentVariant, quantity);
        toast.success(`${product.name} (${currentVariant.size}/${currentVariant.color}) x ${quantity} đã được thêm vào giỏ!`);
    };

    // Hàm map tên màu sang mã màu CSS (cần bổ sung thêm nếu có nhiều màu)
    const getColorCode = (colorName: string): string => {
        if (!colorName) return '#CCCCCC';
        const lowerColor = colorName.toLowerCase().trim();
        const colorMapping: { [key: string]: string } = {
            'trắng': '#FFFFFF',
            'white': '#FFFFFF',
            'đen': '#000000',
            'black': '#000000',
            'xanh nhạt': '#ADD8E6', // Light Blue
            'light blue': '#ADD8E6',
            // Thêm các màu khác ở đây
        };
        return colorMapping[lowerColor] || '#CCCCCC'; // Màu xám mặc định nếu không tìm thấy
    };


    return (
        <div className="mt-6">
            {/* Chọn Size */}
            {uniqueSizes.length > 0 && (
                <div>
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-300">Size: <span className="font-bold text-white">{selectedSize || ''}</span></h3>
                    </div>
                    <fieldset aria-label="Chọn size" className="mt-4">
                        <div className="flex gap-3">
                            {uniqueSizes.map((size) => {
                                // Kiểm tra xem size này có khả dụng không
                                const isDisabled = !product.variants.some(v => v.size === size && v.stock > 0);
                                const isSelected = selectedSize === size;
                                return (
                                    <label
                                        key={size}
                                        className={`group relative flex items-center justify-center rounded-lg border-2 py-3 px-6 text-sm font-semibold uppercase transition-all focus:outline-none ${
                                            isDisabled
                                                ? 'cursor-not-allowed bg-gray-800/50 text-gray-500 border-gray-700'
                                                : isSelected
                                                ? 'cursor-pointer bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/50'
                                                : 'cursor-pointer bg-gray-800/80 text-gray-300 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="size-choice"
                                            value={size}
                                            checked={isSelected}
                                            onChange={() => handleSizeChange(size)}
                                            disabled={isDisabled}
                                            className="sr-only"
                                            aria-label={size}
                                        />
                                        <span>{size}</span>
                                        {isDisabled && (
                                            <span className="pointer-events-none absolute -inset-px rounded-lg border-2 border-gray-600" aria-hidden="true">
                                                <svg className="absolute inset-0 h-full w-full stroke-2 text-gray-600" viewBox="0 0 100 100" preserveAspectRatio="none" stroke="currentColor">
                                                    <line x1="0" y1="100" x2="100" y2="0" vectorEffect="non-scaling-stroke"></line>
                                                </svg>
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>
                </div>
            )}

             {/* Chọn Màu */}
             {availableColors.length > 0 && (
                 <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-300">Màu sắc: <span className="font-bold text-white">{selectedColor || ''}</span></h3>
                     <fieldset aria-label="Chọn màu" className="mt-4">
                        <div className="flex items-center gap-4">
                              {availableColors.map((color) => {
                                  // Kiểm tra xem màu này có khả dụng cho size đã chọn không (case-insensitive)
                                  const variantForColor = selectedSize 
                                      ? product.variants.find(v => {
                                          const variantSize = String(v.size || '').trim();
                                          const variantColor = String(v.color || '').trim();
                                          const selectedSizeTrimmed = String(selectedSize || '').trim();
                                          const colorTrimmed = String(color || '').trim();
                                          return variantSize === selectedSizeTrimmed && variantColor === colorTrimmed;
                                      })
                                      : product.variants.find(v => {
                                          const variantColor = String(v.color || '').trim();
                                          const colorTrimmed = String(color || '').trim();
                                          return variantColor === colorTrimmed;
                                      });
                                  const isDisabled = !variantForColor || variantForColor.stock <= 0;
                                  const bgColor = getColorCode(color);
                                  const isSelected = selectedColor === color;

                                  return (
                                    <label
                                        key={color}
                                        className={`relative flex items-center justify-center rounded-full p-1 focus:outline-none transition-all ${
                                            isDisabled 
                                                ? 'cursor-not-allowed opacity-30' 
                                                : 'cursor-pointer'
                                        } ${
                                            isSelected 
                                                ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-800 scale-110' 
                                                : 'hover:scale-105'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="color-choice"
                                            value={color}
                                            checked={isSelected}
                                            onChange={() => handleColorChange(color)}
                                            disabled={isDisabled}
                                            className="sr-only"
                                            aria-label={color}
                                        />
                                        <span
                                            aria-hidden="true"
                                            className={`h-10 w-10 rounded-full border-2 ${
                                                bgColor === '#FFFFFF' || bgColor === '#000000'
                                                    ? 'border-gray-400'
                                                    : 'border-gray-600'
                                            } shadow-lg`}
                                            style={{ backgroundColor: bgColor }}
                                        />
                                    </label>
                                  );
                              })}
                         </div>
                     </fieldset>
                 </div>
             )}

            {/* Giá và Tình trạng */}
            <p className="mt-8 text-3xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold">
                {currentVariant
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentVariant.price)
                    : (product.variants[0] ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.variants[0].price) : "Liên hệ") // Hiển thị giá mặc định nếu chưa chọn
                }
            </p>
            <p className={`mt-2 text-sm font-medium ${currentVariant && currentVariant.stock > 0 ? 'text-green-400' : (currentVariant && currentVariant.stock === 0 ? 'text-red-400' : 'text-gray-400')}`}>
                {currentVariant
                    ? (currentVariant.stock > 0 ? `Còn hàng (Tồn kho: ${currentVariant.stock})` : 'Hết hàng')
                    : (uniqueSizes.length > 0 || uniqueColors.length > 0 ? 'Vui lòng chọn size/màu' : 'Chưa có hàng')
                }
            </p>

            {/* Chọn Số lượng */}
             {currentVariant && currentVariant.stock > 0 && ( // Chỉ hiển thị khi có hàng và đã chọn variant
                 <div className="mt-8">
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">Số lượng</label>
                      <div className="mt-1 flex items-center border-2 border-gray-600 rounded-lg w-fit bg-gray-800/50">
                        <button
                          type="button"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="px-4 py-2 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                          disabled={quantity <= 1}
                          aria-label="Giảm số lượng"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          id="quantity"
                          name="quantity"
                          min="1"
                          max={currentVariant.stock}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setQuantity(Math.max(1, Math.min(val, selectedVariant.stock))); // Giới hạn số lượng
                          }}
                          className="w-16 text-center border-l-2 border-r-2 border-gray-600 py-2 text-white bg-gray-800 focus:outline-none focus:ring-0"
                          readOnly // Ngăn nhập số âm/lớn
                        />
                        <button
                          type="button"
                           onClick={() => setQuantity(q => Math.min(currentVariant.stock, q + 1))}
                          className="px-4 py-2 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
                           disabled={quantity >= selectedVariant.stock}
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>
                 </div>
             )}

            {/* Nút Thêm vào giỏ */}
            <button
                type="button"
                onClick={handleAddToCart}
                disabled={!currentVariant || currentVariant.stock === 0 || quantity > currentVariant.stock || quantity <= 0}
                className="mt-10 flex w-full items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-base font-semibold text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-700 disabled:from-gray-700 disabled:to-gray-700 transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50"
            >
                {!currentVariant ? 'Vui lòng chọn size/màu' : (currentVariant.stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng')}
            </button>
        </div>
    );
}
