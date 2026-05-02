#!/bin/bash

# Simple update script - just pulls and restarts
cd /home/opc/projects/crushing-calculator

echo "🔄 Updating application..."
git pull origin main

echo "🔄 Restarting services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "✅ Update complete!"
