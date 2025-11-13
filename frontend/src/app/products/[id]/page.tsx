import { Suspense } from 'react';
import AddToCartButton from './_components/AddToCartButton'; // Component client để chọn size/màu
import ProductReviews from './_components/ProductReviews'; // Component reviews
import ProductImage from './_components/ProductImage'; // Client component for image with error handling
import Link from 'next/link';
import { getApiUrl } from '@/lib/server-api';

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
interface Category {
    id: number;
    name: string;
}
interface Product {
  id: number;
  name: string;
  description: string;
  brand: string;
  category?: Category; // Include category nếu có
  variants: ProductVariant[];
}

// --- Hàm gọi API lấy chi tiết sản phẩm (Chạy ở Server) ---
async function getProductDetail(id: string): Promise<Product | null> {
  const apiUrl = getApiUrl(`/products/${id}`);
  console.log(`Fetching product detail from: ${apiUrl}`);

  try {
    const res = await fetch(apiUrl, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Error fetching product detail: ${res.status} ${res.statusText}`, errorText);
      return null;
    }
    
    const data = await res.json();
    console.log('Product detail response:', JSON.stringify(data, null, 2));
    
    if (!data) {
      console.error("Empty response from backend");
      return null;
    }
    
    // Handle both { status: 'success', data: {...} } and direct data response
    const productData = data.data || data;
    
    if (!productData || !productData.id) {
      console.error("Invalid product data structure:", productData);
      return null;
    }
    
    console.log(`Fetched product detail successfully: ${productData.name}`);
    return productData as Product;
  } catch (error) {
    console.error("Network error fetching product detail:", error);
    return null;
  }
}

// --- Component nội dung chính của trang (Server Component) ---
async function ProductDetailContent({ productId }: { productId: string }) {
  const product = await getProductDetail(productId);

  // Xử lý khi không tìm thấy sản phẩm
  if (!product) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-red-600">404 - Không tìm thấy sản phẩm</h1>
        <p className="mt-4 text-gray-600">Sản phẩm bạn tìm kiếm không tồn tại.</p>
        <Link href="/" className="mt-6 inline-block text-indigo-600 hover:underline">
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  // Xử lý khi sản phẩm không có biến thể
  if (!product.variants || product.variants.length === 0) {
      return (
          <div className="text-center py-10">
            <h1 className="text-2xl font-bold text-orange-600">Sản phẩm chưa có sẵn</h1>
            <p className="mt-4 text-gray-600">Sản phẩm này hiện chưa có tùy chọn (size/màu) để mua.</p>
             <Link href="/" className="mt-6 inline-block text-indigo-600 hover:underline">
                Quay về trang chủ
             </Link>
          </div>
      );
  }

  // Lấy ảnh chính từ biến thể đầu tiên
  const mainImage = product.variants[0].image || '/placeholder-image.jpg';

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* Cột Ảnh Sản phẩm */}
        <div className="relative group">
          <div className="aspect-h-4 aspect-w-3 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 shadow-2xl">
            <ProductImage
              src={mainImage}
              alt={product.name}
              width={800}
              height={1000}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-lg">
            {product.variants.length} biến thể
          </div>
        </div>

        {/* Cột Thông tin & Chọn mua */}
        <div className="flex flex-col">
          <div className="sticky top-24">
            {product.brand && (
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-3">
                {product.brand}
              </p>
            )}
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              {product.name}
            </h1>
            {product.category && (
              <div className="mb-6">
                <span className="text-sm text-gray-600">Danh mục: </span>
                <Link 
                  href={`/products?category=${product.category.id}`} 
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {product.category.name}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Component client để chọn Size/Màu và hiển thị giá/nút */}
            <div className="mt-6">
              <AddToCartButton product={product} />
            </div>

            {/* Mô tả sản phẩm */}
            {product.description && (
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả sản phẩm</h2>
                <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section - Full width below product info */}
      <div className="mt-12">
        <ProductReviews productId={product.id} />
      </div>
    </>
  );
}


// --- Trang Chi tiết Sản phẩm (Page) ---
export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string }
}) {
  // Handle both sync and async params (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const productId = resolvedParams.id;

  if (!productId || isNaN(Number(productId))) {
    return (
      <main className="container mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:py-16">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600">ID Sản phẩm không hợp lệ</h1>
          <Link href="/" className="mt-6 inline-block text-indigo-600 hover:underline">
            Quay về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:py-16">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent productId={productId} />
      </Suspense>
    </main>
  );
}

// --- Component Skeleton ---
function ProductDetailSkeleton() {
    return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 animate-pulse">
            {/* Ảnh */}
            <div className="aspect-h-4 aspect-w-3 rounded-lg bg-gray-200"></div>
            {/* Thông tin */}
            <div className="space-y-6">
                <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                <div className="h-8 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-10 w-1/3 bg-gray-200 rounded"></div>
                 {/* Skeleton cho options */}
                 <div className="space-y-4 pt-4">
                     <div className="h-5 w-1/5 bg-gray-200 rounded"></div>
                     <div className="flex gap-4">
                         <div className="h-10 w-16 bg-gray-200 rounded-md"></div>
                         <div className="h-10 w-16 bg-gray-200 rounded-md"></div>
                         <div className="h-10 w-16 bg-gray-200 rounded-md"></div>
                     </div>
                 </div>
                 <div className="space-y-4 pt-4">
                     <div className="h-5 w-1/5 bg-gray-200 rounded"></div>
                     <div className="flex gap-4">
                         <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                         <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                     </div>
                 </div>
                {/* Skeleton nút */}
                 <div className="h-12 w-full bg-gray-200 rounded-lg mt-8"></div>
                {/* Skeleton mô tả */}
                <div className="space-y-3 pt-8 border-t border-gray-200 mt-8">
                    <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                </div>
            </div>
         </div>
    );
}
