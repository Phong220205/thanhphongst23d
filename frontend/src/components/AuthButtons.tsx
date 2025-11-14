'use client'; // <<< CỰC KỲ QUAN TRỌNG

import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthButtons() {
    const router = useRouter();

    // Lấy state từ store
    const { isAuthenticated, user, logout } = useAuthStore();
    const totalItems = useCartStore((state) => state.getTotalItems());

    // State isClient để tránh lỗi Hydration Mismatch
    // (Lỗi server render "Đăng nhập" và client render "Xin chào")
    const [isClient, setIsClient] = useState(false);
  
    useEffect(() => {
        setIsClient(true); // Đánh dấu là đã ở client-side
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/'); // Chuyển về trang chủ sau khi đăng xuất
    }

    // --- Render Logic ---

    // Khi ở server hoặc chưa hydrate, hiển thị skeleton (tránh lỗi)
    if (!isClient) {
        return (
            <div className="flex items-center gap-4 animate-pulse">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            </div>
        );
    }

    // Khi đã ở client, hiển thị đúng
    return (
        <div className="flex items-center gap-2 sm:gap-3">
            {/* Logic Đăng nhập / Đăng xuất */}
            {isAuthenticated ? (
                // Đã đăng nhập
                <>
                    <Link 
                        href="/profile" 
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {user?.name.split(' ')[0] || 'Bạn'}
                    </Link>
                    <Link 
                        href="/orders" 
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Đơn hàng
                    </Link>
                    <button 
                        onClick={handleLogout} 
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Đăng xuất
                    </button>
                </>
            ) : (
                // Chưa đăng nhập
                <Link 
                    href="/login" 
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all duration-200 hover:shadow-lg"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Đăng nhập
                </Link>
            )}

            {/* Icon giỏ hàng */}
            <Link 
                href="/cart" 
                className="relative inline-flex items-center justify-center rounded-xl p-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 hover:scale-110" 
                aria-label="Giỏ hàng"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-6 w-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
                    />
                </svg>
                
                {/* Số lượng item trong giỏ */}
                {totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-2 py-0.5 text-xs font-bold leading-none text-white shadow-lg animate-pulse">
                        {totalItems}
                    </span>
                )}
            </Link>
        </div>
    );
}