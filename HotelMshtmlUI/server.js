// Zero-dependency local web server to bypass browser CORS rules for local file loading
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Normalize URL path
    let filePath = req.url === '/' ? '/index.html' : req.url;
    // Strip query parameters or hashes
    filePath = filePath.split('?')[0].split('#')[0];
    
    const fullPath = path.join(__dirname, filePath);
    
    // Safety check to prevent directory traversal
    if (!fullPath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access Denied');
        return;
    }

    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            const ext = path.extname(fullPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\x1b[32m%s\x1b[0m`, `=====================================================`);
    console.log(`\x1b[36m%s\x1b[0m`, `  Grand Horizon Dashboard Server is running!`);
    console.log(`\x1b[35m%s\x1b[0m`, `  Access URL: http://localhost:${PORT}`);
    console.log(`\x1b[32m%s\x1b[0m`, `=====================================================`);
    console.log(`Press Ctrl+C to stop the server.`);
});
