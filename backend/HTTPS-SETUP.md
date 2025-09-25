# HTTPS Setup for Exmony File Manager

This guide will help you set up HTTPS for your file manager backend, enabling secure document viewing and better browser compatibility.

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)
```bash
cd portal/backend
npm run dev
```

This will automatically:
- Generate self-signed SSL certificates
- Start the HTTPS server on port 3000
- Start HTTP fallback server on port 3001

### Option 2: Manual Setup
```bash
cd portal/backend
npm run setup-ssl
npm start
```

## 🔐 SSL Certificate Details

The setup creates self-signed SSL certificates in the `ssl/` directory:
- `ssl/private-key.pem` - Private key
- `ssl/certificate.pem` - Self-signed certificate

## 🌐 Server Configuration

### HTTPS Server (Primary)
- **URL**: `https://localhost:3000`
- **Purpose**: Main file manager with full features
- **Features**: Document viewing, secure file operations

### HTTP Server (Fallback)
- **URL**: `http://localhost:3001`
- **Purpose**: Fallback for development
- **Features**: Basic file operations (some features may not work)

## ⚠️ Browser Security Warning

When you first visit `https://localhost:3000`, your browser will show a security warning because we're using a self-signed certificate.

### To proceed:
1. Click **"Advanced"** or **"Show Details"**
2. Click **"Proceed to localhost (unsafe)"** or **"Accept the Risk and Continue"**
3. The site will load normally

## 🔧 Troubleshooting

### OpenSSL Not Found
If you get an "OpenSSL not found" error:

**Windows:**
- Install OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html
- Or use Git Bash (includes OpenSSL)

**macOS:**
```bash
brew install openssl
```

**Linux:**
```bash
sudo apt-get install openssl  # Ubuntu/Debian
sudo yum install openssl      # CentOS/RHEL
```

### Certificate Issues
If certificates are corrupted or invalid:
```bash
rm -rf ssl/
npm run setup-ssl
```

### Port Already in Use
If port 3000 is already in use:
1. Stop other services on port 3000
2. Or modify the `PORT` variable in `main.js`

## 🎯 Benefits of HTTPS

### For Document Viewing:
- **Google Docs Viewer** works properly with HTTPS
- **Microsoft Office Online** requires HTTPS
- **Better browser compatibility** for embedded viewers

### For Security:
- **Encrypted file transfers**
- **Secure authentication** (if added later)
- **Modern web standards compliance**

### For Development:
- **Production-like environment**
- **Testing HTTPS features**
- **Better debugging tools**

## 🔄 Switching Between HTTP and HTTPS

### Frontend Configuration
The frontend is configured to use HTTPS by default. To switch back to HTTP:

1. Edit `portal/frontend/src/app/page.tsx`
2. Replace all `https://localhost:3000` with `http://localhost:3000`
3. Restart the frontend

### Backend Configuration
The backend runs both HTTP and HTTPS servers simultaneously:
- HTTPS: `https://localhost:3000` (primary)
- HTTP: `http://localhost:3001` (fallback)

## 📱 Mobile Testing

For testing on mobile devices:

1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   ```

2. Access from mobile: `https://YOUR_IP:3000`
3. Accept the security warning on mobile browser

## 🚀 Production Deployment

For production, replace self-signed certificates with proper SSL certificates:

1. **Let's Encrypt** (free): https://letsencrypt.org/
2. **Cloudflare** (free): https://cloudflare.com/
3. **Commercial certificates**: DigiCert, Comodo, etc.

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Ensure OpenSSL is installed
3. Verify port 3000 is available
4. Check firewall settings

---

**Happy secure file managing! 🔐📁**
