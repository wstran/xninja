#!/bin/bash

# Configuration
BLUE_DIR="/home/ubuntu/xninja.rest-blue"
GREEN_DIR="/home/ubuntu/xninja.rest-green"
GREEN_PORT="5001" # Port on which Green runs
BLUE_PORT="5000" # Port on which Blue runs
NGINX_CONFIG="/etc/nginx/sites-available/api.xninja.tech"
GITHUB_REPO="git@github.com-xninja.rest:eldenkopi/xninja.rest.git"

# Determine which environment is currently running (Blue or Green)
CURRENT_PORT=$(grep -oP 'proxy_pass http://localhost:\K\d+' $NGINX_CONFIG | head -n 1)

# Determine the old PM2 process name
OLD_NAME=""
TARGET_DIR=""
TARGET_PORT=""

if [ "$CURRENT_PORT" == "$BLUE_PORT" ]; then
    TARGET_DIR=$GREEN_DIR
    TARGET_PORT=$GREEN_PORT
    OLD_NAME="xninja.rest-blue"
else
    TARGET_DIR=$BLUE_DIR
    TARGET_PORT=$BLUE_PORT
    OLD_NAME="xninja.rest-green"
fi

TARGET_NAME=""
if [ "$OLD_NAME" == "xninja.rest-blue" ]; then
    TARGET_NAME="xninja.rest-green"
else
    TARGET_NAME="xninja.rest-blue"
fi

# Step 1: Pull from GitHub into target environment
echo "Pulling latest code into target environment ($TARGET_DIR)..."
cd $TARGET_DIR
git pull $GITHUB_REPO

# Step 2: npm Build for target version
echo "Building target environment..."
npm install
npm run build

# Start the target environment using PM2
echo "Starting new environment ($TARGET_NAME) on port $TARGET_PORT..."
pm2 start ecosystem.config.js --env production

# Give server time to start and stabilize
sleep 10

# Step 3: Check if target version index page returns 200
echo "Checking target environment health..."
STATUS_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:$TARGET_PORT/health)

if [ "$STATUS_CODE" -ne 200 ]; then
    echo "Target environment health check failed with status code: $STATUS_CODE"
    exit 1
fi

# Step 4: Switch Nginx to target environment
echo "Switching Nginx to target environment..."
sudo sed -i "s/proxy_pass http:\/\/localhost:[0-9]*;/proxy_pass http:\/\/localhost:$TARGET_PORT;/" $NGINX_CONFIG
sudo nginx -s reload

# Allow a brief period for NGINX to switch over
sleep 5

# Stop and delete old PM2 process (after ensuring the new environment is up and running)
echo "Stopping old environment ($OLD_NAME)..."
pm2 stop $OLD_NAME
pm2 delete $OLD_NAME

pm2 save

echo "Deployment complete. Target environment ($TARGET_NAME) is now live!"
