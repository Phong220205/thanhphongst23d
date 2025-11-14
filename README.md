# Dự án CD Store (Full-Stack E-commerce)

Dự án website thương mại điện tử bán đĩa CD vật lý, xây dựng bằng React (Next.js), Node.js (Express), MySQL, và triển khai bằng Docker.

## 📦 Ngăn xếp công nghệ

* **Frontend:** Next.js (App Router), React, Tailwind CSS, Zustand
* **Backend:** Node.js, Express.js
* **Database:** MySQL
* **ORM:** Sequelize
* **Auth:** JWT (Access + Refresh Tokens)
* **Payment:** Stripe (Sandbox)
* **DevOps:** Docker, Docker Compose
* **Services:** phpMyAdmin (Quản lý DB), Mailtrap (Email Sandbox)
* **API Docs:** Swagger

## 🚀 Cách chạy dự án (Development)

**Yêu cầu:** Đã cài đặt [Docker](https://www.docker.com/products/docker-desktop/) và Docker Compose.

### Quick Start với Docker

**Bước 1: Clone dự án**

```bash
git clone https://your-repo-url/cd-store-project.git
cd cd-store-project
```

**Bước 2: Tạo file `.env`**

Tạo file `.env` trong thư mục gốc với các biến môi trường cần thiết (xem `DOCKER_SETUP.md` để biết chi tiết).

**Bước 3: Chạy với Docker**

```bash
docker-compose up --build
```

Sau khi các service khởi động:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **phpMyAdmin:** http://localhost:8080

📖 **Xem hướng dẫn chi tiết:** [DOCKER_SETUP.md](./DOCKER_SETUP.md)

### Chạy không dùng Docker (Local Development)

**Bước 1: Clone dự án**

```bash
git clone https://your-repo-url/cd-store-project.git
cd cd-store-project