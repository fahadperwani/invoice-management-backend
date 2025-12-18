#!/bin/sh
set -e

echo "Waiting for postgres at ${DB_HOST}:${DB_PORT}..."
until nc -z "${DB_HOST:-db}" "${DB_PORT:-5432}"; do
  sleep 1
done

echo "Waiting for redis at ${REDIS_HOST}:${REDIS_PORT}..."
until nc -z "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}"; do
  sleep 1
done

echo "Running database migrations..."
yarn  migration:run

echo "Starting application..."
yarn  start:prod
