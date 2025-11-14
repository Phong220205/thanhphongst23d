/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.coolmate.me', 
        port: '',
        pathname: '/cdn-cgi/image/**',
      },
      {
        protocol: 'https',
        hostname: 'static.zara.net', 
        port: '',
        pathname: '/photos/**',
      },
      // --- THÊM 2 KHỐI NÀY ---
      {
        protocol: 'https',
        hostname: 'image.uniqlo.com', // Cho phép domain Uniqlo
        port: '',
        pathname: '/**', // Cho phép mọi đường dẫn con
      },
      {
        protocol: 'https',
        hostname: 'cdn.hstatic.net', // Cho phép domain hstatic (bạn gửi link áo sơ mi/quần)
        port: '',
        pathname: '/**', // Cho phép mọi đường dẫn con
      },
      // --- HẾT THÊM ---
      {
        protocol: 'https',
        hostname: 'picsum.photos', 
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

