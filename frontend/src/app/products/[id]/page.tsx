import { Suspense } from 'react';
import ProductDetailClient from './_components/ProductDetailClient'; // Client component wrapper
import ProductReviews from './_components/ProductReviews'; // Component reviews
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
  console.log(`[Frontend] Fetching product detail from: ${apiUrl}`);
  console.log(`[Frontend] Product ID: ${id}`);
  console.log(`[Frontend] Backend URL env: NEXT_PUBLIC_BACKEND_URL_SERVER=${process.env.NEXT_PUBLIC_BACKEND_URL_SERVER || 'not set'}`);
  console.log(`[Frontend] API Base URL env: NEXT_PUBLIC_API_BASE_URL=${process.env.NEXT_PUBLIC_API_BASE_URL || 'not set'}`);

  try {
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(apiUrl, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`[Frontend] Response status: ${res.status} ${res.statusText}`);
    console.log(`[Frontend] Response URL: ${res.url}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Frontend] Error fetching product detail: ${res.status} ${res.statusText}`, errorText);
      console.error(`[Frontend] Request URL was: ${apiUrl}`);
      
      // If 404, product doesn't exist
      if (res.status === 404) {
        console.log(`[Frontend] Product with ID ${id} not found`);
        return null;
      }
      
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
    if (error instanceof Error) {
      // Handle different types of errors
      if (error.name === 'AbortError') {
        console.error("Request timeout: Backend server may be slow or unresponsive");
      } else {
        const errnoError = error as NodeJS.ErrnoException;
        if (errnoError.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
          console.error("Connection refused: Backend server may not be running at", apiUrl);
          console.error("Please ensure the backend server is running on port 5000");
        } else {
          console.error("Network error fetching product detail:", error);
        }
      }
    } else {
      console.error("Network error fetching product detail:", error);
    }
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
        <h1 className="text-2xl font-bold text-red-400">404 - Không tìm thấy sản phẩm</h1>
        <p className="mt-4 text-gray-400">Sản phẩm bạn tìm kiếm không tồn tại.</p>
        <p className="mt-2 text-sm text-gray-500">
          Product ID: {productId}
        </p>
        <div className="mt-6 space-y-2">
          <Link href="/" className="inline-block text-purple-400 hover:text-purple-300 hover:underline transition-colors">
            Quay về trang chủ
          </Link>
          <br />
          <Link href="/products" className="inline-block text-purple-400 hover:text-purple-300 hover:underline transition-colors">
            Xem tất cả sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  // Xử lý khi sản phẩm không có biến thể
  if (!product.variants || product.variants.length === 0) {
      return (
          <div className="text-center py-10">
            <h1 className="text-2xl font-bold text-orange-400">Sản phẩm chưa có sẵn</h1>
            <p className="mt-4 text-gray-400">Sản phẩm này hiện chưa có tùy chọn (size/màu) để mua.</p>
             <Link href="/" className="mt-6 inline-block text-purple-400 hover:text-purple-300 hover:underline transition-colors">
                Quay về trang chủ
             </Link>
          </div>
      );
  }

  return (
    <>
      {/* Product Header Info */}
      <div className="mb-8">
        {product.brand && (
          <p className="text-sm font-bold uppercase tracking-widest text-purple-400 mb-3">
            {product.brand}
          </p>
        )}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          {product.name}
        </h1>
        {product.category && (
          <div className="mb-6">
            <span className="text-sm text-gray-400">Danh mục: </span>
            <Link 
              href={`/products?category=${product.category.id}`} 
              className="inline-flex items-center gap-1 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              {product.category.name}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Product Image and Selection */}
      <ProductDetailClient product={product} />

      {/* Mô tả sản phẩm */}
      {product.description && (
        <div className="mt-10 pt-8 border-t border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Mô tả sản phẩm</h2>
          <div className="prose prose-sm max-w-none text-gray-300 prose-invert" dangerouslySetInnerHTML={{ __html: product.description }} />
        </div>
      )}

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
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:py-16">
          <div className="text-center py-10">
            <h1 className="text-2xl font-bold text-red-400">ID Sản phẩm không hợp lệ</h1>
            <Link href="/" className="mt-6 inline-block text-purple-400 hover:text-purple-300 hover:underline transition-colors">
              Quay về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:py-16">
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailContent productId={productId} />
        </Suspense>
      </div>
    </main>
  );
}

// --- Component Skeleton ---
function ProductDetailSkeleton() {
    return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 animate-pulse">
            {/* Ảnh */}
            <div className="aspect-h-4 aspect-w-3 rounded-2xl bg-gray-800 border border-gray-700"></div>
            {/* Thông tin */}
            <div className="space-y-6">
                <div className="h-4 w-1/4 bg-gray-700 rounded"></div>
                <div className="h-8 w-3/4 bg-gray-700 rounded"></div>
                <div className="h-10 w-1/3 bg-gray-700 rounded"></div>
                 {/* Skeleton cho options */}
                 <div className="space-y-4 pt-4">
                     <div className="h-5 w-1/5 bg-gray-700 rounded"></div>
                     <div className="flex gap-3">
                         <div className="h-12 w-20 bg-gray-700 rounded-lg"></div>
                         <div className="h-12 w-20 bg-gray-700 rounded-lg"></div>
                         <div className="h-12 w-20 bg-gray-700 rounded-lg"></div>
                     </div>
                 </div>
                 <div className="space-y-4 pt-4">
                     <div className="h-5 w-1/5 bg-gray-700 rounded"></div>
                     <div className="flex gap-4">
                         <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
                         <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
                     </div>
                 </div>
                {/* Skeleton nút */}
                 <div className="h-14 w-full bg-gray-700 rounded-lg mt-8"></div>
                {/* Skeleton mô tả */}
                <div className="space-y-3 pt-8 border-t border-gray-700 mt-8">
                    <div className="h-6 w-1/4 bg-gray-700 rounded"></div>
                    <div className="h-4 w-full bg-gray-700 rounded"></div>
                    <div className="h-4 w-full bg-gray-700 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-700 rounded"></div>
                </div>
            </div>
         </div>
    );
}
