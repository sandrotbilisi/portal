const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const logger = require('pino')();
const https = require('https');
const http = require('http');

const app = express();
const PORT = 3000;
const UPLOADS_DIR = 'uploads';

// CORS middleware - allow all origins
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware
app.use(express.json());

// Utility functions
function getFolderSize(folderPath) {
    let total = 0;
    try {
        const items = fs.readdirSync(folderPath);
        
        for (const item of items) {
            const fullPath = path.join(folderPath, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                total += getFolderSize(fullPath);
            } else {
                total += stats.size;
            }
        }
    } catch (error) {
        logger.error('Error calculating folder size:', error);
    }
    
    return total;
}

function getFileInfo(filePath, fileName) {
    try {
        const fullPath = path.join(filePath, fileName);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            return {
                name: fileName,
                type: 'folder',
                size: getFolderSize(fullPath),
                created: stats.birthtime,
                modified: stats.mtime
            };
        } else {
            // Check if it's a YouTube video JSON file
            if (fileName.endsWith('.json')) {
                try {
                    const jsonContent = fs.readFileSync(fullPath, 'utf8');
                    const videoData = JSON.parse(jsonContent);
                    
                    if (videoData.type === 'youtube') {
                        return {
                            name: fileName,
                            type: 'youtube',
                            title: videoData.title,
                            thumbnail: videoData.thumbnail,
                            id: videoData.id,
                            url: videoData.url,
                            size: stats.size,
                            created: stats.birthtime,
                            modified: stats.mtime
                        };
                    }
                } catch (error) {
                    // If JSON parsing fails, treat as regular file
                }
            }
            
            return {
                name: fileName,
                type: mime.lookup(fileName) || 'unknown',
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        }
    } catch (error) {
        logger.error('Error getting file info:', error);
        return null;
    }
}

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    return `${name}-${timestamp}${ext}`;
}

// Routes

// List all items in the uploads folder
app.get('/folders', (req, res) => {
    try {
        ensureDirectoryExists(UPLOADS_DIR);
        const files = fs.readdirSync(UPLOADS_DIR);
        
        const filesWithInfo = files
            .map(file => getFileInfo(UPLOADS_DIR, file))
            .filter(info => info !== null);
        
        res.json({
            success: true,
            data: filesWithInfo
        });
    } catch (error) {
        logger.error('Error listing folders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list folders',
            error: error.message
        });
    }
});

// List items in a specific folder (handles nested paths)
app.get(/^\/folders\/(.+)$/, (req, res) => {
    try {
        // Get the full path from the URL
        const fullUrlPath = req.params[0];
        const fullPath = path.join(UPLOADS_DIR, fullUrlPath);
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'Folder not found'
            });
        }
        
        const stats = fs.statSync(fullPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({
                success: false,
                message: 'Path is not a directory'
            });
        }
        
        const files = fs.readdirSync(fullPath);
        const filesWithInfo = files
            .map(file => getFileInfo(fullPath, file))
            .filter(info => info !== null);
        
        res.json({
            success: true,
            data: filesWithInfo
        });
    } catch (error) {
        logger.error('Error listing folder contents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list folder contents',
            error: error.message
        });
    }
});

// Create a new folder
app.post('/folders', (req, res) => {
    try {
        const { folderName, folderPath: folderPathParam } = req.body;
        
        if (!folderName) {
            return res.status(400).json({
                success: false,
                message: 'Folder name is required'
            });
        }
        
        const fullPath = path.join(UPLOADS_DIR, folderPathParam || '', folderName);
        
        if (fs.existsSync(fullPath)) {
            return res.status(400).json({
                success: false,
                message: 'Folder already exists'
            });
        }
        
        ensureDirectoryExists(fullPath);
        
        res.json({
            success: true,
            message: 'Folder created successfully',
            data: { path: fullPath }
        });
    } catch (error) {
        logger.error('Error creating folder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create folder',
            error: error.message
        });
    }
});

// Upload a file
app.post('/files', (req, res) => {
    const upload = multer();
    
    upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'folderPath', maxCount: 1 }
    ])(req, res, (err) => {
        if (err) {
            logger.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: 'Upload failed',
                error: err.message
            });
        }
        
        try {
            const { folderPath: folderPathParam } = req.body;
            
            if (!req.files || !req.files.file || !req.files.file[0]) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }
            
            const file = req.files.file[0];
            const destinationPath = path.join(UPLOADS_DIR, folderPathParam || '');
            
            // Ensure destination directory exists
            ensureDirectoryExists(destinationPath);
            
            // Generate unique filename
            const filename = generateUniqueFilename(file.originalname);
            const filePath = path.join(destinationPath, filename);
            
            // Save file
            fs.writeFileSync(filePath, file.buffer);
            
            logger.info(`File uploaded: ${filePath}`);
            
            res.json({
                success: true,
                message: 'File uploaded successfully',
                data: {
                    originalname: file.originalname,
                    filename: filename,
                    path: filePath,
                    size: file.size
                }
            });
        } catch (error) {
            logger.error('Error uploading file:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload file',
                error: error.message
            });
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Delete a file or folder
app.delete(/^\/files\/(.+)$/, (req, res) => {
    try {
        const filePath = req.params[0];
        const fullPath = path.join(UPLOADS_DIR, filePath);
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'File or folder not found'
            });
        }
        
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            // Delete directory recursively
            fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
            // Delete file
            fs.unlinkSync(fullPath);
        }
        
        logger.info(`Deleted: ${fullPath}`);
        
        res.json({
            success: true,
            message: 'File or folder deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting file/folder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file or folder',
            error: error.message
        });
    }
});

// Rename a file or folder
app.put(/^\/files\/(.+)$/, (req, res) => {
    try {
        const filePath = req.params[0];
        const { newName } = req.body;
        
        if (!newName || !newName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'New name is required'
            });
        }
        
        const fullPath = path.join(UPLOADS_DIR, filePath);
        const dirPath = path.dirname(fullPath);
        const newFullPath = path.join(dirPath, newName.trim());
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'File or folder not found'
            });
        }
        
        if (fs.existsSync(newFullPath)) {
            return res.status(400).json({
                success: false,
                message: 'A file or folder with this name already exists'
            });
        }
        
        // Validate new name (no special characters)
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(newName)) {
            return res.status(400).json({
                success: false,
                message: 'New name contains invalid characters'
            });
        }
        
        fs.renameSync(fullPath, newFullPath);
        
        logger.info(`Renamed: ${fullPath} -> ${newFullPath}`);
        
        res.json({
            success: true,
            message: 'File or folder renamed successfully',
            data: {
                oldPath: filePath,
                newPath: path.relative(UPLOADS_DIR, newFullPath)
            }
        });
    } catch (error) {
        logger.error('Error renaming file/folder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to rename file or folder',
            error: error.message
        });
    }
});

// Add YouTube video
app.post('/youtube', (req, res) => {
    try {
        const { url, title, folderPath = '' } = req.body;
        
        if (!url || !title) {
            return res.status(400).json({
                success: false,
                message: 'URL and title are required'
            });
        }
        
        // Extract video ID from YouTube URL
        const videoId = extractYouTubeVideoId(url);
        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube URL'
            });
        }
        
        // Create destination directory
        const destinationPath = path.join(UPLOADS_DIR, folderPath);
        ensureDirectoryExists(destinationPath);
        
        // Create video metadata
        const videoData = {
            id: videoId,
            url: url,
            title: title.trim(),
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            type: 'youtube',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        
        // Save as JSON file
        const filename = `${title.trim().replace(/[^a-zA-Z0-9\s\-_]/g, '')}-${Date.now()}.json`;
        const filePath = path.join(destinationPath, filename);
        
        fs.writeFileSync(filePath, JSON.stringify(videoData, null, 2));
        
        logger.info(`YouTube video added: ${title} (${videoId})`);
        
        res.json({
            success: true,
            message: 'YouTube video added successfully',
            data: {
                video: videoData,
                filename: filename
            }
        });
    } catch (error) {
        logger.error('Error adding YouTube video:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add YouTube video',
            error: error.message
        });
    }
});

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// SSL Certificate configuration
const SSL_OPTIONS = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'private-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'certificate.pem'))
};

// Function to create self-signed certificate if it doesn't exist
function createSelfSignedCert() {
    const sslDir = path.join(__dirname, 'ssl');
    const keyPath = path.join(sslDir, 'private-key.pem');
    const certPath = path.join(sslDir, 'certificate.pem');
    
    if (!fs.existsSync(sslDir)) {
        fs.mkdirSync(sslDir);
    }
    
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        logger.info('Creating self-signed SSL certificate...');
        
        const { execSync } = require('child_process');
        try {
            // Generate private key
            execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
            
            // Generate certificate
            execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
            
            logger.info('Self-signed SSL certificate created successfully!');
        } catch (error) {
            logger.error('Failed to create SSL certificate:', error.message);
            logger.info('Please install OpenSSL or create certificates manually');
            process.exit(1);
        }
    }
}

// Start server with HTTPS support
function startServer() {
    try {
        // Create SSL certificates if they don't exist
        createSelfSignedCert();
        
        // Create HTTPS server
        const httpsServer = https.createServer(SSL_OPTIONS, app);
        
        // Start HTTPS server
        httpsServer.listen(PORT, () => {
            logger.info(`🚀 HTTPS Server is running on https://localhost:${PORT}`);
            logger.info(`📁 File manager available at: https://localhost:${PORT}`);
            logger.info(`🔒 SSL Certificate: Self-signed (browser will show security warning)`);
            ensureDirectoryExists(UPLOADS_DIR);
        });
        
        // Also start HTTP server on port 3001 for fallback (optional)
        const httpServer = http.createServer(app);
        httpServer.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.info(`⚠️  HTTP fallback server not started (port 3001 is already in use)`);
            } else {
                logger.error('HTTP fallback server error:', error.message);
            }
        });
        httpServer.listen(3001, () => {
            logger.info(`🌐 HTTP Server is running on http://localhost:3001 (fallback)`);
        });
        
    } catch (error) {
        logger.error('Failed to start HTTPS server:', error.message);
        logger.info('Falling back to HTTP server...');
        
        // Fallback to HTTP if HTTPS fails
        app.listen(PORT, () => {
            logger.info(`🌐 HTTP Server is running on http://localhost:${PORT}`);
            logger.info(`⚠️  Note: Some features may not work without HTTPS`);
            ensureDirectoryExists(UPLOADS_DIR);
        });
    }
}

// Start the server
startServer();