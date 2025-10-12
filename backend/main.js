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
const ORDER_FILE_NAME = '.file-order.json';
const METADATA_FILE_NAME = '.file-metadata.json';
const USERS_DB_FILE = 'users.json';
const BRANCHES_DB_FILE = 'branches.json';
const PERMISSIONS_DB_FILE = 'permissions.json';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = '7d';

// File-based user database
let users = [];

// File-based branches database
let branches = [];

// File-based permissions database
let permissions = [];

// Load users from file
function loadUsers() {
    try {
        if (fs.existsSync(USERS_DB_FILE)) {
            const data = fs.readFileSync(USERS_DB_FILE, 'utf8');
            users = JSON.parse(data);
            logger.info(`Loaded ${users.length} users from database`);
        } else {
            // Create default admin if no users file exists
            users = [
                {
                    id: '1',
                    username: 'admin',
                    passwordHash: bcrypt.hashSync('admin', 10),
                    role: 'admin',
                    name: 'System',
                    lastname: 'Administrator',
                    personalNumber: '000000-0000',
                    branchId: '1'
                }
            ];
            saveUsers();
            logger.info('Created default admin user');
        }
    } catch (error) {
        logger.error('Error loading users:', error);
        users = [];
    }
}

// Save users to file
function saveUsers() {
    try {
        fs.writeFileSync(USERS_DB_FILE, JSON.stringify(users, null, 2));
        logger.info('Users saved to database');
    } catch (error) {
        logger.error('Error saving users:', error);
    }
}

function findUserByUsername(username) {
    return users.find(u => u.username.toLowerCase() === String(username || '').toLowerCase());
}

// Load branches from file
function loadBranches() {
    try {
        if (fs.existsSync(BRANCHES_DB_FILE)) {
            const data = fs.readFileSync(BRANCHES_DB_FILE, 'utf8');
            branches = JSON.parse(data);
            logger.info(`Loaded ${branches.length} branches from database`);
        } else {
            // Create default branch if no branches file exists
            branches = [
                {
                    id: '1',
                    name: 'Main Office',
                    location: 'Headquarters'
                }
            ];
            saveBranches();
            logger.info('Created default branch');
        }
    } catch (error) {
        logger.error('Error loading branches:', error);
        branches = [];
    }
}

// Save branches to file
function saveBranches() {
    try {
        fs.writeFileSync(BRANCHES_DB_FILE, JSON.stringify(branches, null, 2));
        logger.info('Branches saved to database');
    } catch (error) {
        logger.error('Error saving branches:', error);
    }
}

// Load permissions from file
function loadPermissions() {
    try {
        if (fs.existsSync(PERMISSIONS_DB_FILE)) {
            const data = fs.readFileSync(PERMISSIONS_DB_FILE, 'utf8');
            permissions = JSON.parse(data);
            logger.info(`Loaded ${permissions.length} permissions from database`);
        } else {
            // Create empty permissions file if none exists
            permissions = [];
            savePermissions();
            logger.info('Created empty permissions database');
        }
    } catch (error) {
        logger.error('Error loading permissions:', error);
        permissions = [];
    }
}

// Save permissions to file
function savePermissions() {
    try {
        fs.writeFileSync(PERMISSIONS_DB_FILE, JSON.stringify(permissions, null, 2));
        logger.info('Permissions saved to database');
    } catch (error) {
        logger.error('Error saving permissions:', error);
    }
}

// Check if user has permission to access a folder
function checkFolderPermission(folderPath, userId, action) {
    try {
        const user = users.find(u => u.id === userId);
        if (!user) return false;
        
        // Admin always has full access
        if (user.role === 'admin') return true;
        
        // Find permissions for this folder path
        const permission = permissions.find(p => p.folderPath === folderPath);
        
        // If no permissions set, allow access (default behavior)
        if (!permission) return true;
        
        // Check role-based restrictions
        if (permission.roleRestrictions && permission.roleRestrictions[user.role]) {
            const rolePermissions = permission.roleRestrictions[user.role];
            if (rolePermissions[action] === false) return false;
        }
        
        // Check branch-based restrictions
        if (permission.branchRestrictions && permission.branchRestrictions[user.branchId]) {
            const branchPermissions = permission.branchRestrictions[user.branchId];
            if (branchPermissions[action] === false) return false;
        }
        
        return true;
    } catch (error) {
        logger.error('Error checking folder permission:', error);
        return false;
    }
}

// Get all parent paths for a given path (for nested permission checking)
function getParentPaths(folderPath) {
    if (!folderPath) return [];
    const parts = folderPath.split('/').filter(Boolean);
    const paths = [];
    for (let i = 0; i < parts.length; i++) {
        paths.push(parts.slice(0, i + 1).join('/'));
    }
    return paths;
}

// Check if user can view a folder (including parent folder checks)
function canViewFolder(folderPath, userId) {
    // Check if user can view this folder or any parent folder
    const paths = [folderPath, ...getParentPaths(folderPath)];
    for (const path of paths) {
        if (!checkFolderPermission(path, userId, 'view')) {
            return false;
        }
    }
    return true;
}

// Filter folders based on user permissions
function filterFoldersbyPermissions(folders, currentPath, userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    
    // Admin sees everything
    if (user.role === 'admin') return folders;
    
    return folders.filter(folder => {
        const folderPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
        return canViewFolder(folderPath, userId);
    });
}

// Load users, branches, and permissions on startup
loadUsers();
loadBranches();
loadPermissions();

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
        "https://portal.exmony.ge"
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

// Allowed IPs
const allowedIPs = [
    '212.58.119.9', // Nijaradzes 1
    '212.58.119.0', // kazchensky 5
    '188.169.142.160', // khimshiashvili 9
    '212.58.114.123', // kazchensky 19
    '212.58.114.23', // Kobaladze 8a
    '100.101.119.125', // Alex
    '5.512.50.154',// Vepkhvia
    '2a0b:6204:1ad8:d900:cd6:48c4:960c:1f87', // irma
];

app.set('trust proxy', true); // if behind a proxy

// Middleware to block disallowed IPs
app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log('Client IP:', clientIP);

    if (!allowedIPs.includes(clientIP)) {
        console.log('Forbidden: IP not allowed', clientIP);
    
        // send Discord webhook here
        const webhookUrl = 'https://discord.com/api/webhooks/1426985073839968377/IlC-2HpnBzfNIzk9_AA6TFV-h2Xh2T4ZPeWBZLsKhV_cuFW4mm3W4jT3WSh8bR3slf8W';
        
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `Forbidden access attempt from IP: ${clientIP}` })
        }).catch(err => console.error('Webhook error:', err));
    
        return res.status(403).json({ success: false, message: 'Forbidden: IP not allowed' });
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

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
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
        
        // Fetch full user data from database
        const user = users.find(u => u.id === payload.sub);
        if (!user) return res.json({ success: true, data: null });
        
        // Get branch information
        const branch = branches.find(b => b.id === user.branchId);
        
        return res.json({ 
            success: true, 
            data: { 
                username: user.username, 
                role: user.role,
                name: user.name || '',
                lastname: user.lastname || '',
                personalNumber: user.personalNumber || '',
                branchId: user.branchId || '',
                branchName: branch ? branch.name : 'N/A',
                branchLocation: branch ? branch.location : 'N/A'
            } 
        });
    } catch {
        return res.json({ success: true, data: null });
    }
});

// Admin create lower-role users
app.post('/users', requireAuth, requireRole(['admin']), (req, res) => {
    try {
        const { username, password, role, name, lastname, personalNumber, branchId } = req.body || {};
        
        // Validate required fields
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }
        if (!name || !lastname || !personalNumber) {
            return res.status(400).json({ success: false, message: 'Name, lastname, and personal number required' });
        }
        if (!branchId) {
            return res.status(400).json({ success: false, message: 'Branch is required' });
        }
        
        // Check if user exists
        if (findUserByUsername(username)) {
            return res.status(400).json({ success: false, message: 'User exists' });
        }
        
        // Validate branch exists
        const branch = branches.find(b => b.id === branchId);
        if (!branch) {
            return res.status(400).json({ success: false, message: 'Invalid branch' });
        }
        
        // Generate new ID
        const maxId = users.length > 0 ? Math.max(...users.map(u => parseInt(u.id) || 0)) : 0;
        
        const newUser = {
            id: String(maxId + 1),
            username: String(username).trim(),
            passwordHash: bcrypt.hashSync(String(password), 10),
            role: role === 'admin' ? 'admin' : 'user',
            name: String(name).trim(),
            lastname: String(lastname).trim(),
            personalNumber: String(personalNumber).trim(),
            branchId: String(branchId)
        };
        
        users.push(newUser);
        saveUsers();
        
        logger.info(`User created: ${newUser.username} (${newUser.name} ${newUser.lastname}) - Branch: ${branch.name}`);
        
        return res.json({ 
            success: true, 
            data: { 
                id: newUser.id, 
                username: newUser.username, 
                role: newUser.role,
                name: newUser.name,
                lastname: newUser.lastname,
                personalNumber: newUser.personalNumber,
                branchId: newUser.branchId,
                branchName: branch.name
            } 
        });
    } catch (error) {
        logger.error('Create user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

app.get('/users', requireAuth, requireRole(['admin']), (req, res) => {
    const list = users.map(u => {
        const branch = branches.find(b => b.id === u.branchId);
        return {
            id: u.id, 
            username: u.username, 
            role: u.role,
            name: u.name || '',
            lastname: u.lastname || '',
            personalNumber: u.personalNumber || '',
            branchId: u.branchId || '',
            branchName: branch ? branch.name : 'N/A'
        };
    });
    res.json({ success: true, data: list });
});

// Branches endpoints
app.get('/branches', requireAuth, requireRole(['admin']), (req, res) => {
    res.json({ success: true, data: branches });
});

app.post('/branches', requireAuth, requireRole(['admin']), (req, res) => {
    try {
        const { name, location } = req.body || {};
        
        if (!name || !location) {
            return res.status(400).json({ success: false, message: 'Name and location are required' });
        }
        
        // Check if branch name exists
        if (branches.find(b => b.name.toLowerCase() === name.toLowerCase().trim())) {
            return res.status(400).json({ success: false, message: 'Branch name already exists' });
        }
        
        // Generate new ID
        const maxId = branches.length > 0 ? Math.max(...branches.map(b => parseInt(b.id) || 0)) : 0;
        
        const newBranch = {
            id: String(maxId + 1),
            name: String(name).trim(),
            location: String(location).trim()
        };
        
        branches.push(newBranch);
        saveBranches();
        
        logger.info(`Branch created: ${newBranch.name} at ${newBranch.location}`);
        
        return res.json({ success: true, data: newBranch });
    } catch (error) {
        logger.error('Create branch error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create branch' });
    }
});

app.delete('/branches/:id', requireAuth, requireRole(['admin']), (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if any users are assigned to this branch
        const usersInBranch = users.filter(u => u.branchId === id);
        if (usersInBranch.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete branch. ${usersInBranch.length} user(s) are assigned to this branch.` 
            });
        }
        
        const index = branches.findIndex(b => b.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Branch not found' });
        }
        
        branches.splice(index, 1);
        saveBranches();
        
        logger.info(`Branch deleted: ${id}`);
        
        return res.json({ success: true, message: 'Branch deleted successfully' });
    } catch (error) {
        logger.error('Delete branch error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete branch' });
    }
});

// Update user
app.put('/users/:id', requireAuth, requireRole(['admin']), (req, res) => {
    try {
        const { id } = req.params;
        const { username, role, name, lastname, personalNumber, branchId } = req.body || {};
        
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const user = users[userIndex];
        
        // Validate required fields
        if (!username || !name || !lastname || !personalNumber || !branchId) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        // Check if username is taken by another user
        const existingUser = findUserByUsername(username);
        if (existingUser && existingUser.id !== id) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }
        
        // Validate branch exists
        const branch = branches.find(b => b.id === branchId);
        if (!branch) {
            return res.status(400).json({ success: false, message: 'Invalid branch' });
        }
        
        // Update user data
        users[userIndex] = {
            ...user,
            username: String(username).trim(),
            role: role === 'admin' ? 'admin' : 'user',
            name: String(name).trim(),
            lastname: String(lastname).trim(),
            personalNumber: String(personalNumber).trim(),
            branchId: String(branchId)
        };
        
        saveUsers();
        
        logger.info(`User updated: ${users[userIndex].username} (${users[userIndex].name} ${users[userIndex].lastname})`);
        
        return res.json({ 
            success: true, 
            data: {
                id: users[userIndex].id,
                username: users[userIndex].username,
                role: users[userIndex].role,
                name: users[userIndex].name,
                lastname: users[userIndex].lastname,
                personalNumber: users[userIndex].personalNumber,
                branchId: users[userIndex].branchId,
                branchName: branch.name
            }
        });
    } catch (error) {
        logger.error('Update user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update user' });
    }
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
        
        // Get metadata for all files in this directory
        const metadata = getFileMetadata(filePath);
        const fileMetadata = metadata[fileName] || null;
        
        if (stats.isDirectory()) {
            return {
                name: fileName,
                type: 'folder',
                size: getFolderSize(fullPath),
                created: stats.birthtime,
                modified: stats.mtime,
                uploadedBy: fileMetadata?.uploadedBy || null,
                uploadedAt: fileMetadata?.uploadedAt || null
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
                            modified: stats.mtime,
                            uploadedBy: videoData.uploadedBy || fileMetadata?.uploadedBy || null,
                            uploadedAt: videoData.uploadedAt || fileMetadata?.uploadedAt || null
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
                modified: stats.mtime,
                uploadedBy: fileMetadata?.uploadedBy || null,
                uploadedAt: fileMetadata?.uploadedAt || null
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

// Get custom file ordering for a directory
function getCustomOrder(dirPath) {
    try {
        const orderFilePath = path.join(dirPath, ORDER_FILE_NAME);
        if (fs.existsSync(orderFilePath)) {
            const orderData = JSON.parse(fs.readFileSync(orderFilePath, 'utf8'));
            return orderData.order || [];
        }
    } catch (error) {
        logger.error('Error reading custom order:', error);
    }
    return [];
}

// Save custom file ordering for a directory
function saveCustomOrder(dirPath, order) {
    try {
        const orderFilePath = path.join(dirPath, ORDER_FILE_NAME);
        fs.writeFileSync(orderFilePath, JSON.stringify({ order, updated: new Date().toISOString() }, null, 2));
        return true;
    } catch (error) {
        logger.error('Error saving custom order:', error);
        return false;
    }
}

// Get file metadata (uploader info, etc.)
function getFileMetadata(dirPath) {
    try {
        const metadataFilePath = path.join(dirPath, METADATA_FILE_NAME);
        if (fs.existsSync(metadataFilePath)) {
            const metadataContent = JSON.parse(fs.readFileSync(metadataFilePath, 'utf8'));
            return metadataContent.files || {};
        }
    } catch (error) {
        logger.error('Error reading file metadata:', error);
    }
    return {};
}

// Save file metadata (uploader info, etc.)
function saveFileMetadata(dirPath, fileName, userId, username) {
    try {
        const metadataFilePath = path.join(dirPath, METADATA_FILE_NAME);
        let metadata = { files: {} };
        
        // Load existing metadata if it exists
        if (fs.existsSync(metadataFilePath)) {
            try {
                metadata = JSON.parse(fs.readFileSync(metadataFilePath, 'utf8'));
            } catch (e) {
                logger.warn('Failed to parse existing metadata, creating new');
            }
        }
        
        // Update metadata for this file
        metadata.files = metadata.files || {};
        metadata.files[fileName] = {
            uploadedBy: username,
            uploadedById: userId,
            uploadedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));
        return true;
    } catch (error) {
        logger.error('Error saving file metadata:', error);
        return false;
    }
}

// Apply custom ordering to file list
function applySortOrder(files, customOrder) {
    if (!customOrder || customOrder.length === 0) {
        return files;
    }
    
    const orderMap = new Map(customOrder.map((name, index) => [name, index]));
    
    return files.sort((a, b) => {
        const indexA = orderMap.has(a.name) ? orderMap.get(a.name) : Infinity;
        const indexB = orderMap.has(b.name) ? orderMap.get(b.name) : Infinity;
        return indexA - indexB;
    });
}

function generateUniqueFilename(originalName) {
    try {
        // Decode filename properly - multer receives as Latin-1 but browsers send UTF-8
        const buffer = Buffer.from(originalName, 'latin1');
        const decodedName = buffer.toString('utf8');
        
        const timestamp = Date.now();
        const ext = path.extname(decodedName);
        const name = path.basename(decodedName, ext);
        
        // Keep Unicode characters (Georgian, Russian, etc.), only remove dangerous filesystem chars
        const safeName = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
        
        return `${safeName}-${timestamp}${ext}`;
    } catch (error) {
        logger.error('Error generating filename:', error);
        return `file-${Date.now()}${path.extname(originalName)}`;
    }
}

// Routes (protected)

// List all items in the uploads folder
app.get('/folders', requireAuth, requireRole(['admin', 'user']), (req, res) => {
    try {
        ensureDirectoryExists(UPLOADS_DIR);
        const files = fs.readdirSync(UPLOADS_DIR);
        
        let filesWithInfo = files
            .filter(file => file !== ORDER_FILE_NAME && file !== METADATA_FILE_NAME) // Exclude order and metadata files
            .map(file => getFileInfo(UPLOADS_DIR, file))
            .filter(info => info !== null);
        
        // Apply permission filtering for non-admin users
        filesWithInfo = filterFoldersbyPermissions(filesWithInfo, '', req.user.sub);
        
        // Apply custom ordering
        const customOrder = getCustomOrder(UPLOADS_DIR);
        filesWithInfo = applySortOrder(filesWithInfo, customOrder);
        
        // Add permission info for each folder (for frontend to know what actions are allowed)
        let currentFolderPermissions = null;
        if (req.user.role !== 'admin') {
            // Check permissions for current folder (for upload capability)
            currentFolderPermissions = {
                canView: true, // They're already viewing it
                canUpload: checkFolderPermission('', req.user.sub, 'upload'),
                canDelete: checkFolderPermission('', req.user.sub, 'delete'),
                canRename: checkFolderPermission('', req.user.sub, 'rename')
            };
            
            filesWithInfo = filesWithInfo.map(file => {
                const folderPath = file.name;
                return {
                    ...file,
                    permissions: {
                        canView: checkFolderPermission(folderPath, req.user.sub, 'view'),
                        canUpload: checkFolderPermission(folderPath, req.user.sub, 'upload'),
                        canDelete: checkFolderPermission(folderPath, req.user.sub, 'delete'),
                        canRename: checkFolderPermission(folderPath, req.user.sub, 'rename')
                    }
                };
            });
        }
        
        res.json({
            success: true,
            data: filesWithInfo,
            currentFolderPermissions
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
app.get(/^\/folders\/(.+)$/, requireAuth, requireRole(['admin', 'user']), (req, res) => {
    try {
        // Get the full path from the URL
        const fullUrlPath = req.params[0];
        const fullPath = path.join(UPLOADS_DIR, fullUrlPath);
        
        // Check if user has permission to view this folder
        if (!canViewFolder(fullUrlPath, req.user.sub)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this folder'
            });
        }
        
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
        let filesWithInfo = files
            .filter(file => file !== ORDER_FILE_NAME && file !== METADATA_FILE_NAME) // Exclude order and metadata files
            .map(file => getFileInfo(fullPath, file))
            .filter(info => info !== null);
        
        // Apply permission filtering for non-admin users
        filesWithInfo = filterFoldersbyPermissions(filesWithInfo, fullUrlPath, req.user.sub);
        
        // Apply custom ordering
        const customOrder = getCustomOrder(fullPath);
        filesWithInfo = applySortOrder(filesWithInfo, customOrder);
        
        // Add permission info for each folder (for frontend to know what actions are allowed)
        let currentFolderPermissions = null;
        if (req.user.role !== 'admin') {
            // Check permissions for current folder (for upload capability)
            currentFolderPermissions = {
                canView: true, // They're already viewing it
                canUpload: checkFolderPermission(fullUrlPath, req.user.sub, 'upload'),
                canDelete: checkFolderPermission(fullUrlPath, req.user.sub, 'delete'),
                canRename: checkFolderPermission(fullUrlPath, req.user.sub, 'rename')
            };
            
            filesWithInfo = filesWithInfo.map(file => {
                const folderPath = fullUrlPath ? `${fullUrlPath}/${file.name}` : file.name;
                return {
                    ...file,
                    permissions: {
                        canView: checkFolderPermission(folderPath, req.user.sub, 'view'),
                        canUpload: checkFolderPermission(folderPath, req.user.sub, 'upload'),
                        canDelete: checkFolderPermission(folderPath, req.user.sub, 'delete'),
                        canRename: checkFolderPermission(folderPath, req.user.sub, 'rename')
                    }
                };
            });
        }
        
        res.json({
            success: true,
            data: filesWithInfo,
            currentFolderPermissions
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
app.post('/folders', requireAuth, requireRole(['admin']), (req, res) => {
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
        
        // Save metadata about who created the folder
        const user = users.find(u => u.id === req.user.sub);
        const creatorName = user ? `${user.name} ${user.lastname}` : req.user.username;
        const parentPath = path.join(UPLOADS_DIR, folderPathParam || '');
        saveFileMetadata(parentPath, folderName, req.user.sub, creatorName);
        
        // Auto-create read-only permissions for new folders
        const newFolderPath = folderPathParam ? `${folderPathParam}/${folderName}` : folderName;
        
        // Create default read-only permission (view only, no upload/delete/rename)
        const defaultPermission = {
            id: String(Date.now()),
            folderPath: newFolderPath,
            roleRestrictions: {
                user: {
                    view: true,
                    upload: false,
                    delete: false,
                    rename: false
                }
            },
            branchRestrictions: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        permissions.push(defaultPermission);
        savePermissions();
        
        logger.info(`Folder created with read-only permissions: ${newFolderPath}`);
        
        res.json({
            success: true,
            message: 'Folder created successfully with read-only permissions',
            data: { 
                path: fullPath,
                permission: defaultPermission
            }
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

// Permissions Management Endpoints

// Get all permissions
app.get('/permissions', requireAuth, requireRole(['admin']), (req, res) => {
    try {
        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        logger.error('Error getting permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get permissions',
            error: error.message
        });
    }
});

// Get permission for a specific folder
app.get(/^\/permissions\/(.+)$/, requireAuth, requireRole(['admin']), (req, res) => {
    try {
        let folderPath = decodeURIComponent(req.params[0]);
        // Special handling for root directory
        if (folderPath === '__root__') {
            folderPath = '';
        }
        const permission = permissions.find(p => p.folderPath === folderPath);
        
        res.json({
            success: true,
            data: permission || null
        });
    } catch (error) {
        logger.error('Error getting permission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get permission',
            error: error.message
        });
    }
});

// Create or update permission for a folder
app.post('/permissions', requireAuth, requireRole(['admin']), (req, res) => {
    try {
        const { folderPath, roleRestrictions, branchRestrictions } = req.body;
        
        // Allow empty string for root directory, but not undefined/null
        if (folderPath === undefined || folderPath === null) {
            return res.status(400).json({
                success: false,
                message: 'Folder path is required'
            });
        }
        
        // Check if permission already exists
        const existingIndex = permissions.findIndex(p => p.folderPath === folderPath);
        
        const permission = {
            id: existingIndex !== -1 ? permissions[existingIndex].id : String(Date.now()),
            folderPath,
            roleRestrictions: roleRestrictions || {},
            branchRestrictions: branchRestrictions || {},
            createdAt: existingIndex !== -1 ? permissions[existingIndex].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (existingIndex !== -1) {
            // Update existing permission
            permissions[existingIndex] = permission;
            logger.info(`Permission updated for folder: ${folderPath || 'root'}`);
        } else {
            // Create new permission
            permissions.push(permission);
            logger.info(`Permission created for folder: ${folderPath || 'root'}`);
        }
        
        savePermissions();
        
        res.json({
            success: true,
            data: permission,
            message: existingIndex !== -1 ? 'Permission updated successfully' : 'Permission created successfully'
        });
    } catch (error) {
        logger.error('Error creating/updating permission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create/update permission',
            error: error.message
        });
    }
});

// Delete permission for a folder
app.delete(/^\/permissions\/(.+)$/, requireAuth, requireRole(['admin']), (req, res) => {
    try {
        let folderPath = decodeURIComponent(req.params[0]);
        // Special handling for root directory
        if (folderPath === '__root__') {
            folderPath = '';
        }
        
        const index = permissions.findIndex(p => p.folderPath === folderPath);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }
        
        permissions.splice(index, 1);
        savePermissions();
        
        logger.info(`Permission deleted for folder: ${folderPath || 'root'}`);
        
        res.json({
            success: true,
            message: 'Permission deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting permission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete permission',
            error: error.message
        });
    }
});

// Upload a file
app.post('/files', requireAuth, requireRole(['admin', 'user']), (req, res) => {
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
            
            // Check upload permission for non-admin users
            if (req.user.role !== 'admin' && !checkFolderPermission(folderPathParam || '', req.user.sub, 'upload')) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to upload files to this folder'
                });
            }
            
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
            
            // Save metadata about who uploaded the file
            const user = users.find(u => u.id === req.user.sub);
            const uploaderName = user ? `${user.name} ${user.lastname}` : req.user.username;
            saveFileMetadata(destinationPath, filename, req.user.sub, uploaderName);
            
            logger.info(`File uploaded: ${filePath} by ${uploaderName}`);
            
            res.json({
                success: true,
                message: 'File uploaded successfully',
                data: {
                    originalname: file.originalname,
                    filename: filename,
                    path: filePath,
                    size: file.size,
                    uploadedBy: uploaderName
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
app.delete(/^\/files\/(.+)$/, requireAuth, requireRole(['admin', 'user']), (req, res) => {
    try {
        const filePath = req.params[0];
        const fullPath = path.join(UPLOADS_DIR, filePath);
        
        // Get the folder path (parent directory)
        const folderPath = path.dirname(filePath).replace(/\\/g, '/');
        const normalizedFolderPath = folderPath === '.' ? '' : folderPath;
        
        // Check delete permission for non-admin users
        if (req.user.role !== 'admin' && !checkFolderPermission(normalizedFolderPath, req.user.sub, 'delete')) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete files in this folder'
            });
        }
        
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
app.put(/^\/files\/(.+)$/, requireAuth, requireRole(['admin', 'user']), (req, res) => {
    try {
        const filePath = req.params[0];
        const { newName, updateYouTubeTitle, newTitle } = req.body;
        
        const fullPath = path.join(UPLOADS_DIR, filePath);
        
        // Get the folder path (parent directory)
        const folderPath = path.dirname(filePath).replace(/\\/g, '/');
        const normalizedFolderPath = folderPath === '.' ? '' : folderPath;
        
        // Check rename permission for non-admin users
        if (req.user.role !== 'admin' && !checkFolderPermission(normalizedFolderPath, req.user.sub, 'rename')) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to rename files in this folder'
            });
        }
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'File or folder not found'
            });
        }
        
        // Handle YouTube video title update
        if (updateYouTubeTitle) {
            if (!newTitle || !newTitle.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'New title is required'
                });
            }
            
            // Read the JSON file
            try {
                const jsonContent = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                
                // Update the title
                jsonContent.title = newTitle.trim();
                
                // Write back to the file
                fs.writeFileSync(fullPath, JSON.stringify(jsonContent, null, 2));
                
                logger.info(`Updated YouTube video title: ${fullPath}`);
                
                return res.json({
                    success: true,
                    message: 'YouTube video title updated successfully',
                    data: {
                        path: filePath,
                        newTitle: newTitle.trim()
                    }
                });
            } catch (error) {
                logger.error('Error updating YouTube video title:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update video title',
                    error: error.message
                });
            }
        }
        
        // Handle regular file/folder rename
        if (!newName || !newName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'New name is required'
            });
        }
        
        const dirPath = path.dirname(fullPath);
        const newFullPath = path.join(dirPath, newName.trim());
        
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

// Update file order
app.post('/folders/order', requireAuth, requireRole(['admin']), (req, res) => {
    try {
        const { folderPath = '', order } = req.body;
        
        if (!Array.isArray(order)) {
            return res.status(400).json({
                success: false,
                message: 'Order must be an array of file names'
            });
        }
        
        const fullPath = path.join(UPLOADS_DIR, folderPath);
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'Folder not found'
            });
        }
        
        const success = saveCustomOrder(fullPath, order);
        
        if (success) {
            res.json({
                success: true,
                message: 'File order updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to save file order'
            });
        }
    } catch (error) {
        logger.error('Error updating file order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update file order',
            error: error.message
        });
    }
});

// Add YouTube video
app.post('/youtube', requireAuth, requireRole(['admin']), (req, res) => {
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
        
        // Get uploader information
        const user = users.find(u => u.id === req.user.sub);
        const uploaderName = user ? `${user.name} ${user.lastname}` : req.user.username;
        
        // Create video metadata
        const videoData = {
            id: videoId,
            url: url,
            title: title.trim(),
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            type: 'youtube',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            uploadedBy: uploaderName,
            uploadedAt: new Date().toISOString()
        };
        
        // Save as JSON file
        // Keep Unicode characters, only remove dangerous filesystem characters
        const safeTitle = title.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
        const filename = `${safeTitle}-${Date.now()}.json`;
        const filePath = path.join(destinationPath, filename);
        
        fs.writeFileSync(filePath, JSON.stringify(videoData, null, 2));
        
        // Also save to metadata file
        saveFileMetadata(destinationPath, filename, req.user.sub, uploaderName);
        
        logger.info(`YouTube video added: ${title} (${videoId}) by ${uploaderName}`);
        
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