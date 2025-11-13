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
npx sequelize-cli db:migrate || echo "Migration failed or already up to date"

echo "Starting server..."
exec node server.js

