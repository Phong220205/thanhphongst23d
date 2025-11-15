# Docker Setup Guide

This guide will help you set up and run the CD Store e-commerce project using Docker.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Docker Compose (included with Docker Desktop)
- Git (to clone the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd cd-store-project
```

### 2. Create Environment File

Create a `.env` file in the root directory (`cd-store-project/`) with the following variables:

```env
# Database Configuration
DB_HOST=db
DB_NAME=cd_store
DB_USER=root
DB_PASS=your_secure_password_here
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Stripe Payment (Optional - leave empty if not using Stripe)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend Environment Variables
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_URL_SERVER=http://host.docker.internal:5000
```

**Important:** Replace `your_secure_password_here` and `your_jwt_secret_key_here_minimum_32_characters_long` with your own secure values.

### 3. Build and Start Services

```bash
docker-compose up --build
```

This command will:
- Build Docker images for backend and frontend
- Start MySQL database
- Start backend server (runs migrations automatically)
- Start frontend Next.js application
- Start phpMyAdmin for database management

### 4. Access the Application

Once all services are running, you can access:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **phpMyAdmin:** http://localhost:8080
  - Server: `db`
  - Username: `root`
  - Password: (value from `DB_PASS` in `.env`)

## Docker Services

The `docker-compose.yml` file defines 4 services:

### 1. Database (MySQL)
- **Container:** `cd_store_db`
- **Port:** 3307 (host) → 3306 (container)
- **Data Persistence:** Volume `db-data`
- **Health Check:** Enabled

### 2. Backend (Node.js/Express)
- **Container:** `cd_store_backend`
- **Port:** 5000
- **Features:**
  - Automatically runs database migrations on startup
  - Waits for database to be ready before starting
  - Hot reload enabled (development mode)

### 3. Frontend (Next.js)
- **Container:** `cd_store_frontend`
- **Port:** 3000
- **Features:**
  - Production build
  - Waits for backend to be ready before starting

### 4. phpMyAdmin
- **Container:** `cd_store_pma`
- **Port:** 8080
- **Purpose:** Database management interface

## Common Docker Commands

### Start Services
```bash
docker-compose up
```

### Start in Background (Detached Mode)
```bash
docker-compose up -d
```

### Rebuild and Start
```bash
docker-compose up --build
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ This will delete database data)
```bash
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### View Logs in Real-time
```bash
docker-compose logs -f
```

### Execute Commands in Containers

**Backend:**
```bash
docker-compose exec backend sh
```

**Frontend:**
```bash
docker-compose exec frontend sh
```

**Database:**
```bash
docker-compose exec db mysql -u root -p
```

### Run Migrations Manually
```bash
docker-compose exec backend npx sequelize-cli db:migrate
```

### Run Seeders (if available)
```bash
docker-compose exec backend npx sequelize-cli db:seed:all
```

## Troubleshooting

### Port Already in Use

If you get an error that a port is already in use:

1. **Change ports in `docker-compose.yml`:**
   ```yaml
   ports:
     - "5001:5000"  # Change 5000 to 5001
     - "3001:3000"  # Change 3000 to 3001
   ```

2. **Or stop the service using the port:**
   ```bash
   # Find process using port 5000
   netstat -ano | findstr :5000
   # Kill the process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

### Database Connection Issues

1. **Check if database is healthy:**
   ```bash
   docker-compose ps
   ```

2. **Check database logs:**
   ```bash
   docker-compose logs db
   ```

3. **Verify environment variables:**
   ```bash
   docker-compose exec backend env | grep DB_
   ```

### Backend Not Starting

1. **Check backend logs:**
   ```bash
   docker-compose logs backend
   ```

2. **Verify JWT_SECRET is set:**
   ```bash
   docker-compose exec backend env | grep JWT_SECRET
   ```

3. **Check if migrations are running:**
   ```bash
   docker-compose logs backend | grep -i migration
   ```

### Frontend Build Errors

1. **Rebuild frontend:**
   ```bash
   docker-compose build --no-cache frontend
   docker-compose up frontend
   ```

2. **Check frontend logs:**
   ```bash
   docker-compose logs frontend
   ```

### Clear Everything and Start Fresh

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose rm -f

# Rebuild everything
docker-compose up --build
```

## Development vs Production

### Development Mode (Current Setup)

- Hot reload enabled for backend
- Development dependencies included
- Debug logging enabled
- Source code mounted as volumes

### Production Mode

To run in production mode:

1. **Update `docker-compose.yml`:**
   ```yaml
   environment:
     - NODE_ENV=production
   ```

2. **Remove volume mounts for source code** (already done in frontend)

3. **Use production build:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
   ```

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_HOST` | Database hostname | Yes | `db` |
| `DB_NAME` | Database name | Yes | `cd_store` |
| `DB_USER` | Database username | Yes | `root` |
| `DB_PASS` | Database password | Yes | - |
| `DB_PORT` | Database port | No | `3306` |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | `7d` |
| `PORT` | Backend server port | No | `5000` |
| `NODE_ENV` | Environment mode | No | `development` |
| `CLIENT_URL` | Frontend URL for CORS | No | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Stripe API secret key | No | - |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API base URL | No | `http://localhost:5000/api` |
| `NEXT_PUBLIC_BACKEND_URL_SERVER` | Server-side backend URL | No | `http://host.docker.internal:5000` |

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Support

If you encounter any issues, please:
1. Check the logs: `docker-compose logs`
2. Verify your `.env` file is correctly configured
3. Ensure Docker Desktop is running
4. Check that ports 3000, 5000, 3307, and 8080 are available

