// frontend/src/app/page.tsx
import { ProductCard } from "@/components/ProductCard";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image"; // Import Image component
import { getApiUrl } from "@/lib/server-api";

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
interface Category { 
  id: number;
  name: string;
}

// ---------------------------------------------------
// --- HÀM GỌI API GỐC (ĐÃ BẬT LẠI) ---
// ---------------------------------------------------

// --- Hàm gọi API lấy Sản phẩm Mới Nhất ---
async function getNewProducts(): Promise<Product[]> {
  const apiUrl = getApiUrl('/products?limit=8'); // Lấy 8 sản phẩm mới nhất
  console.log(`Fetching NEW products from: ${apiUrl}`);
  try {
    const res = await fetch(apiUrl, { next: { revalidate: 60 } }); // Cache 60s
    if (!res.ok) {
      console.error(`Error fetching new products: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.data)) { return []; }
    console.log(`Fetched ${data.data.length} new products successfully.`);
    return data.data as Product[];
  } catch (error) {
    console.error("Network error fetching new products:", error);
    return [];
  }
}

// --- Hàm gọi API lấy Danh mục ---
async function getCategories(): Promise<Category[]> {
  const apiUrl = getApiUrl('/categories');
  console.log(`Fetching categories from: ${apiUrl}`);
  try {
    const res = await fetch(apiUrl, { next: { revalidate: 3600 } }); // Cache 1 giờ
    if (!res.ok) {
      console.error(`Error fetching categories: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
     if (!data || !Array.isArray(data.data)) { return []; }
    console.log(`Fetched ${data.data.length} categories successfully.`);
    return data.data as Category[];
  } catch (error) {
    console.error("Network error fetching categories:", error);
    return [];
  }
}

// ---------------------------------------------------
// --- COMPONENTS SỬ DỤNG HÀM TRÊN (GIỮ NGUYÊN LOGIC) ---
// ---------------------------------------------------

// --- Component Section Danh mục ---
async function CategoriesSection() {
    const categories = await getCategories();
    if (categories.length === 0) return null;

    const categoryImages: { [key: string]: string } = {
        'Áo T-shirt': 'https://media.coolmate.me/cdn-cgi/image/width=672,height=990,quality=80/uploads/July2023/t-shirt-co-tron-coolmate-basics-den_61.jpg',
        'Áo Sơ mi': 'https://cdn.hstatic.net/products/1000360022/untitled-1_bf6ebe5963b441ffb523138cbfc116eb_1024x1024.jpg',
        'Quần Jeans': 'https://cdn.hstatic.net/products/1000360022/untitled-1_d9f67af12473494187f1cc7e014066fe_1024x1024.jpg',
    };

    return (
        <section className="bg-gradient-to-b from-white to-gray-50 py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                    Khám phá <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Danh mục</span>
            </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Tìm kiếm sản phẩm yêu thích của bạn trong các danh mục đa dạng
                </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
                <Link
                key={category.id}
                href={`/products?category=${category.id}`} 
                className="group relative block overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                <div className="aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                <Image
                    src={categoryImages[category.name] || '/placeholder-image.jpg'}
                    alt={category.name}
                    width={400}
                    height={500}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
                    <div className="w-full">
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:translate-y-[-4px] transition-transform duration-300">
                    {category.name}
                    </h3>
                        <div className="flex items-center gap-2 text-white/90 text-sm">
                            <span>Xem thêm</span>
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>
                    </div>
                </div>
                </Link>
            ))}
            </div>
        </div>
        </section>
    );
}


// --- Component Section Sản phẩm Mới ---
async function NewProductsSection() {
    const products = await getNewProducts();
    
    if (products.length === 0) {
        return (
             <section className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 text-center">
                <p className="text-lg text-gray-500 py-10">Hiện không có sản phẩm nào.</p>
                <Link href="/products" className="text-indigo-600 hover:underline font-medium">
                    Xem tất cả sản phẩm &rarr;
                </Link>
            </section>
        );
    }
    
    return (
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
                <span className="text-5xl">🔥</span>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
                    Hàng Mới Về
        </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Khám phá những sản phẩm mới nhất được cập nhật hàng tuần
            </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
            <ProductCard key={product.id} product={product} />
            ))}
        </div>
        <div className="mt-12 text-center">
            <Link 
                href="/products" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
            >
                <span>Xem tất cả sản phẩm</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </Link>
        </div>
        </section>
    );
}

// --- Trang chủ (Page - Cập nhật) ---
export default function HomePage() {
    return (
        <>
        {/* Section Hero Banner */}
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
            
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl mb-6 animate-fade-in">
                        Phong cách Mới,<br />
                        <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                            Cuộc sống Mới
                        </span>
                </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-xl sm:text-2xl text-indigo-100 drop-shadow-lg font-light">
                    Khám phá bộ sưu tập thời trang mới nhất và định hình phong cách riêng của bạn.
                </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/products"
                            className="group relative inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-indigo-600 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl"
                        >
                            <span>Mua sắm ngay</span>
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    <Link
                    href="/products"
                            className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/50 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white"
                    >
                            Khám phá thêm
                    </Link>
                    </div>
                </div>
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </section>

        {/* Section Danh mục */}
        <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesSection />
        </Suspense>

        {/* Section Sản phẩm Mới */}
        <Suspense fallback={<ProductGridSkeleton />}>
            <NewProductsSection />
        </Suspense>
        </>
    );
}

// --- Component Skeletons ---
function CategoriesSkeleton() {
    return (
        <section className="bg-gray-100 py-12 sm:py-16">
        <div className="container mx-auto max-w-7xl px-4">
            <div className="h-8 w-1/3 mx-auto bg-gray-300 rounded mb-8 animate-pulse"></div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-lg animate-pulse"></div>
            ))}
            </div>
        </div>
        </section>
    );
}

function ProductGridSkeleton() {
    return (
        <section className="container mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="h-8 w-1/3 mx-auto bg-gray-300 rounded mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => ( // Hiển thị 8 skeleton
            <div key={i} className="animate-pulse rounded-lg border bg-white shadow-sm">
                <div className="aspect-h-4 aspect-w-3 w-full bg-gray-200"></div>
                <div className="p-4">
                <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                <div className="mt-2 h-5 w-3/4 rounded bg-gray-200"></div>
                <div className="mt-4 h-6 w-1/4 rounded bg-gray-200"></div>
                <div className="mt-4 h-10 w-full rounded-md bg-gray-200"></div>
                </div>
            </div>
            ))}
        </div>
        </section>
    );
}