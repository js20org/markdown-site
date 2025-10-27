import fs from 'fs';
import path from 'path';
import { type Website } from '../types.js';

export function copyPublicAssets(website: Website) {
    const { publicPath, outputDirectoryPath } = website;

    if (!publicPath) {
        return;
    }

    console.log('Copying public assets...');
    
    const targetPath = path.join(outputDirectoryPath, 'public');
    fs.cpSync(publicPath, targetPath, { recursive: true });

    console.log('Copied public assets.');
}
