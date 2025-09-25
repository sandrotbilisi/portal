#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Setting up SSL certificates for HTTPS...\n');

const sslDir = path.join(__dirname, 'ssl');
const keyPath = path.join(sslDir, 'private-key.pem');
const certPath = path.join(sslDir, 'certificate.pem');

// Create SSL directory if it doesn't exist
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir);
    console.log('✅ Created SSL directory');
}

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('✅ SSL certificates already exist');
    console.log(`   Key: ${keyPath}`);
    console.log(`   Cert: ${certPath}`);
    console.log('\n🚀 You can now start the server with HTTPS support!');
    process.exit(0);
}

try {
    console.log('🔑 Generating private key...');
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    console.log('📜 Generating self-signed certificate...');
    execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Exmony/CN=localhost"`, { stdio: 'inherit' });
    
    console.log('\n✅ SSL certificates created successfully!');
    console.log(`   Key: ${keyPath}`);
    console.log(`   Cert: ${certPath}`);
    console.log('\n🚀 You can now start the server with HTTPS support!');
    console.log('⚠️  Note: Browsers will show a security warning for self-signed certificates.');
    console.log('   Click "Advanced" and "Proceed to localhost" to continue.');
    
} catch (error) {
    console.error('❌ Failed to create SSL certificates:', error.message);
    console.log('\n📋 Manual setup instructions:');
    console.log('1. Install OpenSSL: https://www.openssl.org/');
    console.log('2. Run these commands in the backend directory:');
    console.log('   mkdir ssl');
    console.log('   openssl genrsa -out ssl/private-key.pem 2048');
    console.log('   openssl req -new -x509 -key ssl/private-key.pem -out ssl/certificate.pem -days 365 -subj "/C=US/ST=State/L=City/O=Exmony/CN=localhost"');
    process.exit(1);
}
