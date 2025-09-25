#!/bin/bash

echo "🌍 Setting up public access for Exmony File Manager..."
echo ""

# Check if running on Raspberry Pi
if [[ $(uname -m) == "arm"* ]]; then
    echo "✅ Detected Raspberry Pi (ARM architecture)"
    ARCH="arm64"
else
    echo "✅ Detected other Linux system"
    ARCH="amd64"
fi

echo ""
echo "Choose your public access method:"
echo "1) ngrok (Quick & Easy - FREE tier)"
echo "2) Cloudflare Tunnel (More features - FREE)"
echo "3) Manual port forwarding setup"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Setting up ngrok..."
        
        # Install ngrok
        echo "📦 Installing ngrok..."
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok -y
        
        echo ""
        echo "🔑 Please sign up at https://ngrok.com/ and get your auth token"
        read -p "Enter your ngrok auth token: " token
        
        if [ -n "$token" ]; then
            ngrok config add-authtoken $token
            echo "✅ ngrok configured successfully!"
        else
            echo "❌ No token provided. Please run 'ngrok config add-authtoken YOUR_TOKEN' manually"
        fi
        
        echo ""
        echo "🚀 Starting ngrok tunnel..."
        echo "Your file manager will be available at the HTTPS URL shown below:"
        echo ""
        ngrok http 3000
        ;;
        
    2)
        echo ""
        echo "☁️ Setting up Cloudflare Tunnel..."
        
        # Install cloudflared
        echo "📦 Installing cloudflared..."
        if [[ $ARCH == "arm64" ]]; then
            curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
        else
            curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        fi
        sudo dpkg -i cloudflared.deb
        rm cloudflared.deb
        
        echo ""
        echo "🔑 Please login to Cloudflare..."
        cloudflared tunnel login
        
        echo ""
        echo "🏗️ Creating tunnel..."
        cloudflared tunnel create exmony-filemanager
        
        echo ""
        echo "📝 Setting up tunnel configuration..."
        
        # Create config file for no-domain setup
        cat > ~/.cloudflared/config.yml << EOF
tunnel: exmony-filemanager
credentials-file: /home/pi/.cloudflared/\$(ls ~/.cloudflared/*.json | head -1 | xargs basename)

ingress:
  - service: https://localhost:3000
    originRequest:
      noTLSVerify: true
EOF
        
        echo "✅ Configuration created!"
        echo ""
        echo "🚀 Starting tunnel with FREE subdomain..."
        echo "Your file manager will be available at a random subdomain like:"
        echo "https://random-words-1234.trycloudflare.com"
        echo ""
        cloudflared tunnel run exmony-filemanager
        ;;
        
    3)
        echo ""
        echo "🔧 Manual port forwarding setup..."
        echo ""
        echo "📋 Steps to complete manually:"
        echo "1. Access your router admin panel (usually 192.168.1.1)"
        echo "2. Find 'Port Forwarding' or 'Virtual Server'"
        echo "3. Add rule: External Port 443 → Internal IP:$(hostname -I | awk '{print $1}') Port 3000"
        echo "4. Get your public IP: curl ifconfig.me"
        echo "5. Access via: https://YOUR_PUBLIC_IP"
        echo ""
        echo "⚠️  Note: You may need to set up a real SSL certificate for public access"
        echo "📖 See PUBLIC-ACCESS-SETUP.md for detailed instructions"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete! Your file manager should now be accessible publicly."
echo "📖 For more details, see PUBLIC-ACCESS-SETUP.md"
