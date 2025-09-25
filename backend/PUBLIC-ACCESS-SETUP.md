# 🌍 Making Exmony File Manager Publicly Accessible

This guide will help you make your file manager accessible from anywhere in the world while keeping it secure.

## 🚨 Security Warning

**IMPORTANT**: Making your file manager public means anyone can access it. Make sure to:
- Set up authentication (recommended)
- Use strong passwords
- Consider file access restrictions
- Monitor access logs

## 🎯 Option 1: Cloudflare Tunnel (Recommended - FREE)

### Why Cloudflare Tunnel?
- ✅ **FREE** - No cost for basic usage
- ✅ **Secure** - End-to-end encryption
- ✅ **No port forwarding** - Works behind firewalls/NAT
- ✅ **Custom domain** - Get a free subdomain
- ✅ **DDoS protection** - Built-in security

### Setup Steps:

#### 1. Install Cloudflare Tunnel
```bash
# On your Raspberry Pi
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb
```

#### 2. Login to Cloudflare
```bash
cloudflared tunnel login
```

#### 3. Create a Tunnel
```bash
cloudflared tunnel create exmony-filemanager
```

#### 4. Configure the Tunnel (No Domain Required!)
Create config file:
```bash
nano ~/.cloudflared/config.yml
```

Add this content:
```yaml
tunnel: exmony-filemanager
credentials-file: /home/pi/.cloudflared/[tunnel-id].json

ingress:
  - service: https://localhost:3000
    originRequest:
      noTLSVerify: true
```

#### 5. Run with Random Subdomain (FREE!)
```bash
cloudflared tunnel run exmony-filemanager
```

This will give you a random subdomain like: `https://random-words-1234.trycloudflare.com`

#### 6. Run the Tunnel
```bash
cloudflared tunnel run exmony-filemanager
```

#### 7. Auto-start on Boot
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## 🎯 Option 2: ngrok (Quick & Easy - FREE tier available)

### Why ngrok?
- ✅ **Super easy** - One command setup
- ✅ **FREE tier** - 1 tunnel, 40 connections
- ✅ **HTTPS included** - Automatic SSL
- ✅ **No configuration** - Works immediately

### Setup Steps:

#### 1. Install ngrok
```bash
# Download and install
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

#### 2. Sign up and get auth token
1. Go to https://ngrok.com/
2. Sign up for free account
3. Get your auth token from dashboard

#### 3. Configure ngrok
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### 4. Start tunnel
```bash
ngrok http 3000
```

#### 5. Auto-start on boot
Create systemd service:
```bash
sudo nano /etc/systemd/system/ngrok.service
```

Add this content:
```ini
[Unit]
Description=ngrok tunnel
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/bin/ngrok http 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ngrok
sudo systemctl start ngrok
```

## 🎯 Option 3: Port Forwarding (Traditional Method)

### Why Port Forwarding?
- ✅ **Direct access** - No third-party services
- ✅ **Full control** - Complete ownership
- ✅ **No limits** - No connection restrictions

### Setup Steps:

#### 1. Configure Router
1. Access your router admin panel (usually 192.168.1.1)
2. Find "Port Forwarding" or "Virtual Server"
3. Add rule:
   - **External Port**: 443 (HTTPS) or 80 (HTTP)
   - **Internal IP**: Your Pi's IP (e.g., 192.168.1.100)
   - **Internal Port**: 3000
   - **Protocol**: TCP

#### 2. Get Public IP
```bash
curl ifconfig.me
```

#### 3. Update SSL Certificate
For public access, you need a real SSL certificate:

```bash
# Install certbot
sudo apt install certbot

# Get Let's Encrypt certificate
sudo certbot certonly --standalone -d yourdomain.com
```

#### 4. Update Backend Configuration
Modify `main.js` to use real certificates:

```javascript
const SSL_OPTIONS = {
    key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
};
```

## 🔐 Adding Authentication (Recommended)

### Basic HTTP Authentication
Add to your backend `main.js`:

```javascript
const basicAuth = require('express-basic-auth');

app.use(basicAuth({
    users: { 'admin': 'your-secure-password' },
    challenge: true,
    realm: 'Exmony File Manager'
}));
```

### Install the package:
```bash
npm install express-basic-auth
```

## 🌐 Domain Setup (Optional)

### Option 1: FREE Cloudflare Subdomain (No Domain Required!)
Cloudflare Tunnel provides free random subdomains:
- **Format**: `https://random-words-1234.trycloudflare.com`
- **Cost**: FREE
- **Setup**: Automatic when running tunnel
- **SSL**: Included automatically

### Option 2: Custom Domain (Optional)
If you want a custom domain:
1. **Freenom** - Free .tk, .ml, .ga domains
2. **No-IP** - Free dynamic DNS
3. **DuckDNS** - Free subdomain service
4. **Cloudflare** - Add your own domain

### Dynamic DNS Update Script:
```bash
#!/bin/bash
# Update dynamic DNS
curl "https://www.duckdns.org/update?domains=yourdomain&token=your-token&ip="
```

## 📱 Mobile Access

Once public, access from anywhere:
- **URL**: `https://yourdomain.com` or `https://your-ngrok-url.ngrok.io`
- **Mobile browsers** work perfectly
- **Responsive design** adapts to mobile screens

## 🔧 Troubleshooting

### Common Issues:

#### 1. "Connection Refused"
- Check if server is running: `sudo netstat -tlnp | grep 3000`
- Verify firewall: `sudo ufw status`

#### 2. "SSL Certificate Error"
- For self-signed: Accept security warning
- For public: Ensure certificate is valid

#### 3. "Tunnel Not Working"
- Check tunnel status: `cloudflared tunnel list`
- Verify DNS: `nslookup yourdomain.com`

#### 4. "Port Forwarding Not Working"
- Check router configuration
- Verify external IP: `curl ifconfig.me`
- Test locally first: `curl https://localhost:3000`

## 🚀 Performance Optimization

### For Raspberry Pi:
```bash
# Increase file limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize Node.js
export NODE_OPTIONS="--max-old-space-size=512"
```

### Enable Compression:
```javascript
const compression = require('compression');
app.use(compression());
```

## 📊 Monitoring

### Log Access:
```bash
# Monitor access logs
tail -f /var/log/nginx/access.log

# Monitor tunnel status
cloudflared tunnel info exmony-filemanager
```

### Set up alerts:
- Monitor uptime with UptimeRobot
- Set up email notifications for downtime
- Monitor disk space and performance

## 🎯 Recommended Setup for Raspberry Pi

**Best combination:**
1. **Cloudflare Tunnel** for secure access
2. **Basic authentication** for security
3. **Custom domain** for easy access
4. **Auto-start services** for reliability

This gives you:
- ✅ Free, secure, global access
- ✅ No port forwarding needed
- ✅ Built-in DDoS protection
- ✅ Easy to remember URL
- ✅ Works behind any firewall

---

**🌍 Your file manager is now accessible from anywhere in the world!**

**Next steps:**
1. Choose your preferred method (Cloudflare Tunnel recommended)
2. Set up authentication for security
3. Test access from different devices
4. Monitor usage and performance

**Happy global file managing! 🚀📁**
