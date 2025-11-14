#!/bin/sh
set -e

echo "Waiting for database..."
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}

until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is up - running migrations..."
# Set environment variables for sequelize-cli if not using DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  export DB_HOST=${DB_HOST:-db}
  export DB_NAME=${DB_NAME:-cd_store}
  export DB_USER=${DB_USER:-root}
  export DB_PASS=${DB_PASS}
  export DB_PORT=${DB_PORT:-3306}
fi
npx sequelize-cli db:migrate || echo "Migration failed or already up to date"

echo "Starting server..."
exec node server.js

