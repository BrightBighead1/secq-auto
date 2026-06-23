#!/bin/bash
# ============================================
# SecQ-Auto Setup Script for FreeShell.de
# ============================================

set -e

echo "🚀 Setting up SecQ-Auto CowAgent on FreeShell.de..."

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Python 3.12
sudo apt-get install -y python3.12 python3.12-venv python3-pip

# Create app directory
mkdir -p ~/secq-auto
cd ~/secq-auto

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip setuptools wheel
pip install -r freeshell/cowagent/requirements.txt

# Create .env file
cat > .env << 'ENVEOF'
NORTHFLANK_URL=https://your-app.northflank.app
OMNI_URL=https://your-app.northflank.app:3000/v1/chat/completions
ROUTER9_URL=https://your-app.northflank.app:4000/v1/chat/completions
QDRANT_URL=https://your-app.northflank.app:6333
JWT_SECRET=your-super-secret-jwt-key-change-this
ENVEOF

# Create systemd service for 24/7 operation
sudo tee /etc/systemd/system/secq-auto.service > /dev/null << 'SVCEOF'
[Unit]
Description=SecQ-Auto CowAgent API
After=network.target

[Service]
Type=simple
User='$USER'
WorkingDirectory=/home/'$USER'/secq-auto
EnvironmentFile=/home/'$USER'/secq-auto/.env
ExecStart=/home/'$USER'/secq-auto/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVCEOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable secq-auto
sudo systemctl start secq-auto

echo ""
echo "✅ ============================================"
echo "   SecQ-Auto CowAgent is now running 24/7!"
echo "   API: http://$(hostname -I | awk '{print $1}'):8000"
echo "   Docs: http://$(hostname -I | awk '{print $1}'):8000/docs"
echo "   Health: curl http://localhost:8000/health"
echo "============================================="