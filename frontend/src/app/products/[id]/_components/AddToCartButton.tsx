'use client'; // Client component

import { useState, useEffect } from 'react';
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
}

export default function AddToCartButton({ product }: Props) {
    const addItem = useCartStore((state) => state.addItem);

    // Lấy variant mặc định (variant đầu tiên)
    const initialVariant = product.variants?.[0] || null;

    // State để lưu trữ size và màu đang được chọn
    const [selectedSize, setSelectedSize] = useState<string | null>(initialVariant?.size || null);
    const [selectedColor, setSelectedColor] = useState<string | null>(initialVariant?.color || null);
    const [quantity, setQuantity] = useState(1);

    // State để lưu trữ variant tương ứng với size/màu đã chọn
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    // Lấy danh sách size và màu duy nhất từ các biến thể
    const uniqueSizes = Array.from(new Set(product.variants.map(v => v.size))).filter(Boolean);
    const uniqueColors = Array.from(new Set(product.variants.map(v => v.color))).filter(Boolean);

    // Effect để tìm variant tương ứng khi size hoặc màu thay đổi
    useEffect(() => {
        // Cố gắng tìm variant khớp chính xác
        let foundVariant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor);
        
        // Nếu không tìm thấy (ví dụ: mới vào trang, chỉ chọn 1 trong 2)
        if (!foundVariant) {
            if (selectedSize && !selectedColor) {
                 // Nếu chỉ chọn size, tự động chọn màu đầu tiên có sẵn cho size đó
                const firstColorForSize = product.variants.find(v => v.size === selectedSize);
                if (firstColorForSize) {
                    setSelectedColor(firstColorForSize.color);
                    foundVariant = firstColorForSize;
                }
            } else if (!selectedSize && selectedColor) {
                // Nếu chỉ chọn màu, tự động chọn size đầu tiên có sẵn cho màu đó
                const firstSizeForColor = product.variants.find(v => v.color === selectedColor);
                 if (firstSizeForColor) {
                    setSelectedSize(firstSizeForColor.size);
                    foundVariant = firstSizeForColor;
                }
            }
        }
        
        setSelectedVariant(foundVariant || null);
        setQuantity(1); // Reset số lượng khi đổi variant
    }, [selectedSize, selectedColor, product.variants]);

    // Hàm xử lý khi chọn size/màu (tự động cập nhật lựa chọn còn lại nếu cần)
    const handleSizeChange = (size: string) => {
        setSelectedSize(size);
        // Kiểm tra xem màu hiện tại có khả dụng với size mới không
        const isColorAvailable = product.variants.some(v => v.size === size && v.color === selectedColor && v.stock > 0);
        // Nếu không, chọn màu đầu tiên có sẵn cho size mới đó
        if (!isColorAvailable) {
            const firstAvailableColor = product.variants.find(v => v.size === size && v.stock > 0)?.color;
            setSelectedColor(firstAvailableColor || null);
        }
    };
    
    const handleColorChange = (color: string) => {
         setSelectedColor(color);
         // Kiểm tra xem size hiện tại có khả dụng với màu mới không
         const isSizeAvailable = product.variants.some(v => v.color === color && v.size === selectedSize && v.stock > 0);
         // Nếu không, chọn size đầu tiên có sẵn cho màu mới đó
         if (!isSizeAvailable) {
             const firstAvailableSize = product.variants.find(v => v.color === color && v.stock > 0)?.size;
             setSelectedSize(firstAvailableSize || null);
         }
    };

    const handleAddToCart = () => {
        if (!selectedVariant) {
            toast.error("Vui lòng chọn đầy đủ size và màu.");
            return;
        }
         if (quantity > selectedVariant.stock) {
            toast.error(`Số lượng tồn kho chỉ còn ${selectedVariant.stock}.`);
            return;
        }
         if (quantity <= 0) {
            toast.error("Số lượng phải lớn hơn 0.");
            return;
        }

        const productInfo = { id: product.id, name: product.name, brand: product.brand };
        addItem(productInfo, selectedVariant, quantity);
        toast.success(`${product.name} (${selectedVariant.size}/${selectedVariant.color}) x ${quantity} đã được thêm vào giỏ!`);
    };

    // Hàm map tên màu sang mã màu CSS (cần bổ sung thêm nếu có nhiều màu)
    const getColorCode = (colorName: string): string => {
        if (!colorName) return '#CCCCCC';
        const lowerColor = colorName.toLowerCase();
        const colorMapping: { [key: string]: string } = {
            'trắng': '#FFFFFF',
            'đen': '#000000',
            'xanh nhạt': '#ADD8E6', // Light Blue
            // Thêm các màu khác ở đây
        };
        return colorMapping[lowerColor] || '#CCCCCC'; // Màu xám mặc định nếu không tìm thấy
    };


    return (
        <form onSubmit={(e) => e.preventDefault()} className="mt-6">
            {/* Chọn Size */}
            {uniqueSizes.length > 0 && (
                <div>
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">Size: <span className="font-bold">{selectedSize || ''}</span></h3>
                    </div>
                    <fieldset aria-label="Chọn size" className="mt-4">
                        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6">
                            {uniqueSizes.map((size) => {
                                // Kiểm tra xem size này có khả dụng không
                                const isDisabled = !product.variants.some(v => v.size === size && v.stock > 0);
                                return (
                                    <label
                                        key={size}
                                        className={`group relative flex items-center justify-center rounded-md border py-3 px-4 text-sm font-medium uppercase focus:outline-none sm:flex-1 ${
                                            isDisabled
                                                ? 'cursor-not-allowed bg-gray-50 text-gray-200'
                                                : 'cursor-pointer bg-white text-gray-900 shadow-sm hover:bg-gray-50'
                                        } ${
                                            selectedSize === size ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="size-choice"
                                            value={size}
                                            checked={selectedSize === size}
                                            onChange={() => handleSizeChange(size)}
                                            disabled={isDisabled}
                                            className="sr-only"
                                            aria-label={size}
                                        />
                                        <span>{size}</span>
                                        <span className={`pointer-events-none absolute -inset-px rounded-md ${selectedSize === size && !isDisabled ? 'border border-indigo-500' : ''}`} aria-hidden="true" />
                                        {isDisabled && <span className="pointer-events-none absolute -inset-px rounded-md border-2 border-gray-200" aria-hidden="true"><svg className="absolute inset-0 h-full w-full stroke-2 text-gray-200" viewBox="0 0 100 100" preserveAspectRatio="none" stroke="currentColor"><line x1="0" y1="100" x2="100" y2="0" vectorEffect="non-scaling-stroke"></line></svg></span>}
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>
                </div>
            )}

             {/* Chọn Màu */}
             {uniqueColors.length > 0 && (
                 <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-900">Màu sắc: <span className="font-bold">{selectedColor || ''}</span></h3>
                     <fieldset aria-label="Chọn màu" className="mt-4">
                        <div className="flex items-center space-x-3">
                              {uniqueColors.map((color) => {
                                  // Kiểm tra xem màu này có khả dụng không
                                  const isDisabled = !product.variants.some(v => v.color === color && v.stock > 0);
                                  const bgColor = getColorCode(color);

                                  return (
                                    <label
                                        key={color}
                                        className={`relative -m-0.5 flex items-center justify-center rounded-full p-0.5 focus:outline-none ${isDisabled ? 'cursor-not-allowed opacity-25' : 'cursor-pointer'} ${
                                            selectedColor === color ? 'ring ring-indigo-500 ring-offset-1' : ''
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="color-choice"
                                            value={color}
                                            checked={selectedColor === color}
                                            onChange={() => handleColorChange(color)}
                                            disabled={isDisabled}
                                            className="sr-only"
                                            aria-label={color}
                                        />
                                        <span
                                            aria-hidden="true"
                                            className={`h-8 w-8 rounded-full border border-black border-opacity-10`}
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
            <p className="mt-8 text-3xl tracking-tight text-gray-900">
                {selectedVariant
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedVariant.price)
                    : (product.variants[0] ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.variants[0].price) : "Liên hệ") // Hiển thị giá mặc định nếu chưa chọn
                }
            </p>
            <p className={`mt-2 text-sm font-medium ${selectedVariant && selectedVariant.stock > 0 ? 'text-green-600' : (selectedVariant && selectedVariant.stock === 0 ? 'text-red-600' : 'text-gray-500')}`}>
                {selectedVariant
                    ? (selectedVariant.stock > 0 ? `Còn hàng (Tồn kho: ${selectedVariant.stock})` : 'Hết hàng')
                    : (uniqueSizes.length > 0 || uniqueColors.length > 0 ? 'Vui lòng chọn size/màu' : 'Chưa có hàng')
                }
            </p>

            {/* Chọn Số lượng */}
             {selectedVariant && selectedVariant.stock > 0 && ( // Chỉ hiển thị khi có hàng và đã chọn variant
                 <div className="mt-8">
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Số lượng</label>
                      <div className="mt-1 flex items-center border rounded-md w-fit">
                        <button
                          type="button"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="px-3 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l"
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
                          max={selectedVariant.stock}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setQuantity(Math.max(1, Math.min(val, selectedVariant.stock))); // Giới hạn số lượng
                          }}
                          className="w-12 text-center border-l border-r py-1 text-gray-900 focus:outline-none focus:ring-0"
                          readOnly // Ngăn nhập số âm/lớn
                        />
                        <button
                          type="button"
                           onClick={() => setQuantity(q => Math.min(selectedVariant.stock, q + 1))}
                          className="px-3 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r"
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
                disabled={!selectedVariant || selectedVariant.stock === 0 || quantity > selectedVariant.stock || quantity <= 0}
                className="mt-10 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-400"
            >
                {!selectedVariant ? 'Vui lòng chọn size/màu' : (selectedVariant.stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng')}
            </button>
        </form>
    );
}
