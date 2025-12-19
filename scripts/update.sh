#!/bin/bash

# Simple update script - just pulls and restarts
cd /home/opc/projects/crushing-calculator

echo "🔄 Updating application..."
git pull origin main

echo "🔄 Restarting services..."
docker compose down
docker compose up -d --build

echo "✅ Update complete!"
