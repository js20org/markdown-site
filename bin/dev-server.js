#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { execSync } = require('child_process');
const express = require('express');
const open = require('better-opn');

const outputPath = path.resolve('./dist-website');
const publicPath = path.resolve(outputPath, 'public');

const fullPaths = [
    path.resolve('./src/index.ts'),
    path.resolve('./site'),
    path.resolve('./site-assets'),
];

function verifyValidPaths() {
    fullPaths.forEach(path => {
        if (!fs.existsSync(path)) {
            console.error(`Invalid path: ${path}`);
            process.exit(1);
        }
    });
}

function build() {
    console.log('Building...');

    try {
        execSync('npm run build', { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
        console.error('Build failed');
        console.error(error.stderr.toString());
    }
    
}

function run() {
    verifyValidPaths();
    build();

    const app = express();

    app.use(express.static(publicPath));
    app.get('*', (req, res) => {
        const filePath = path.join(outputPath, req.path);
        const shouldReturnAsIs = fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory();

        if (shouldReturnAsIs) {
            res.sendFile(filePath);
            return;
        }

        const htmlFileName = req.path === '/' ? 'index' : req.path;
        const withoutStartingSlash = htmlFileName.startsWith('/') ? htmlFileName.slice(1) : htmlFileName;
        const withoutEndingSlash = withoutStartingSlash.endsWith('/') ? withoutStartingSlash.slice(0, -1) : withoutStartingSlash;
        const htmlPath = path.resolve(outputPath, withoutEndingSlash + '.html');

        if (fs.existsSync(htmlPath)) {
            res.sendFile(htmlPath);
        } else {
            res.status(404).send('Dev server can\'t find the requested file');
        }
    });

    chokidar.watch(fullPaths, {
        persistent: true,
        ignoreInitial: true
    }).on('all', build);

    app.listen(8080, () => {
        console.log('Server is running at http://localhost:8080');
        open('http://localhost:8080');
    });
}

run();
