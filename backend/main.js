const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const logger = require('pino')();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const UPLOADS_DIR = 'uploads';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = '7d';

// Simple in-memory user store (replace with DB later)
// Default admin created on server start if none exists
const users = [
    {
        id: '1',
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin', 10),
        role: 'admin'
    }
];

function findUserByUsername(username) {
    return users.find(u => u.username.toLowerCase() === String(username || '').toLowerCase());
}

function generateToken(user) {
    return jwt.sign({ sub: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function setAuthCookie(res, token) {
    res.cookie('auth', token, {
        httpOnly: true,
        sameSite: 'none', // Allow cross-site cookies
        secure: true, // Set to false for HTTP localhost
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

function clearAuthCookie(res) {
    res.clearCookie('auth');
}

// CORS for credentials (allow localhost for development)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow specific localhost origins for development
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'https://home-server.tail7b1d07.ts.net', // Your backend domain
        'https://localhost:3000',
    ];
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Middleware
app.use(express.json());
app.use(cookieParser());

// Auth middlewares
function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.auth || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);
        if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (req.user.role !== role) return res.status(403).json({ success: false, message: 'Forbidden' });
        next();
    };
}

// Auth routes
app.post('/auth/login', (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }
        const user = findUserByUsername(username);
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const ok = bcrypt.compareSync(password, user.passwordHash);
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const token = generateToken(user);
        setAuthCookie(res, token);
        return res.json({ 
            success: true, 
            data: { username: user.username, role: user.role },
            token: token // Add this line
        });
    } catch (error) {
        logger.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Login failed' });
    }
});

app.post('/auth/logout', (req, res) => {
    clearAuthCookie(res);
    return res.json({ success: true });
});

app.get('/auth/me', (req, res) => {
    try {
        const token = req.cookies?.auth || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);
        if (!token) return res.status(200).json({ success: true, data: null });
        const payload = jwt.verify(token, JWT_SECRET);
        return res.json({ success: true, data: { username: payload.username, role: payload.role } });
    } catch {
        return res.json({ success: true, data: null });
    }
});

// Admin create lower-role users
app.post('/users', requireAuth, requireRole('admin'), (req, res) => {
    try {
        const { username, password, role } = req.body || {};
        if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });
        if (findUserByUsername(username)) return res.status(400).json({ success: false, message: 'User exists' });
        const newUser = {
            id: String(users.length + 1),
            username: String(username),
            passwordHash: bcrypt.hashSync(String(password), 10),
            role: role === 'admin' ? 'admin' : 'user'
        };
        users.push(newUser);
        return res.json({ success: true, data: { id: newUser.id, username: newUser.username, role: newUser.role } });
    } catch (error) {
        logger.error('Create user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

app.get('/users', requireAuth, requireRole('admin'), (req, res) => {
    const list = users.map(u => ({ id: u.id, username: u.username, role: u.role }));
    res.json({ success: true, data: list });
});

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

// Routes (protected)

// List all items in the uploads folder
app.get('/folders', requireAuth, requireRole('admin'), (req, res) => {
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
app.get(/^\/folders\/(.+)$/, requireAuth, requireRole('admin'), (req, res) => {
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
app.post('/folders', requireAuth, requireRole('admin'), (req, res) => {
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
app.post('/files', requireAuth, requireRole('admin'), (req, res) => {
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
app.delete(/^\/files\/(.+)$/, requireAuth, requireRole('admin'), (req, res) => {
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
app.put(/^\/files\/(.+)$/, requireAuth, requireRole('admin'), (req, res) => {
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
app.post('/youtube', requireAuth, requireRole('admin'), (req, res) => {
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running on port ${PORT}`);
    ensureDirectoryExists(UPLOADS_DIR);
});