#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { execSync } = require('child_process');
const express = require('express');
const open = require('better-opn');

function getResolvedOrNull(next) {
    if (next) {
        return path.resolve(next);
    }
    return null;
}

const settings = {
    outputPath: getResolvedOrNull(process.env.OUTPUT_PATH),
    publicPath: getResolvedOrNull(process.env.PUBLIC_PATH),
    appDirectory: getResolvedOrNull(process.env.APP_DIRECTORY),
    watchPath: getResolvedOrNull(process.env.WATCH_PATH),
    buildCommand: process.env.BUILD_COMMAND,
}

const outputPath = settings.outputPath || path.resolve('./dist-website');
const publicPath = settings.publicPath || path.resolve(outputPath, 'public');
const appDirectory = settings.appDirectory || process.cwd();

const watchPath = settings.watchPath;
const fullPaths = watchPath ? [watchPath] : [
    getFirstExistingPath([
        path.resolve(appDirectory, './src/index.ts'),
        path.resolve(appDirectory, './index.ts'),
    ]),
    path.resolve(appDirectory, './site'),
    getFirstExistingPath([
        path.resolve(appDirectory, './site-assets'),
        path.resolve(appDirectory, './assets'),
    ]),
];

function getFirstExistingPath(paths) {
    for (const item of paths) {
        if (fs.existsSync(item)) {
            return item;
        }
    }

    throw new Error(`None of the paths exist: ${paths.join(', ')}`);
}

function verifyValidPaths() {
    fullPaths.forEach(path => {
        if (!fs.existsSync(path)) {
            console.error(`Invalid path: ${path}`);
            process.exit(1);
        }
    });
}

const buildCommand = settings.buildCommand || 'build';

function build() {
    console.log('Building...');

    try {
        execSync(`npm run ${buildCommand}`, { stdio: ['ignore', 'pipe', 'pipe'] });
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
