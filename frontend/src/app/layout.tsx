import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import { Toaster } from "react-hot-toast"; 
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import SearchBar from "@/components/SearchBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clothing Store",
  description: "E-commerce site for clothing",
};  

// --- Component Header (Server Component - Chỉ render cấu trúc) ---
function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md shadow-sm">
      <nav className="container mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg font-bold text-xl">
          MyStore
            </div>
          </div>
        </Link>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <SearchBar />
        </div>
        
        {/* Các nút (Sản phẩm, Đăng nhập, Giỏ hàng) */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <Link 
            href="/products" 
            className="text-sm font-semibold text-gray-700 hover:text-indigo-600 hidden sm:inline transition-colors duration-200"
          >
            Sản phẩm
          </Link>
        <AuthButtons /> 
        </div>
      </nav>
    </header>
  );
}

// --- Layout chính (Server Component) ---
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900 antialiased`}>
        {/* Provider cho thông báo (Toast) */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#1f2937',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Header />
        
        <main className="min-h-screen">
          {children}
        </main>
        
        <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm mt-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  MyStore
                </h3>
                <p className="text-sm text-gray-600 max-w-md">
                  Khám phá bộ sưu tập thời trang mới nhất và định hình phong cách riêng của bạn.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Liên kết</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/products" className="hover:text-indigo-600 transition-colors">Sản phẩm</Link></li>
                  <li><Link href="/about" className="hover:text-indigo-600 transition-colors">Về chúng tôi</Link></li>
                  <li><Link href="/contact" className="hover:text-indigo-600 transition-colors">Liên hệ</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Hỗ trợ</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/faq" className="hover:text-indigo-600 transition-colors">FAQ</Link></li>
                  <li><Link href="/shipping" className="hover:text-indigo-600 transition-colors">Vận chuyển</Link></li>
                  <li><Link href="/returns" className="hover:text-indigo-600 transition-colors">Đổi trả</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
              © 2025 MyStore. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}