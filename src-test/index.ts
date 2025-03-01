import path from 'path';
import { Website } from '../src/types';
import { buildWebsite } from '../src/builder';

const website: Website = {
    url: 'https://www.viralexplained.com',
    name: 'viralexplained.com',
    sitePath: path.resolve(__dirname, '../site-test'),
    outputDirectoryPath: path.resolve(__dirname, '../dist-website'),
    cssImports: {
        css: 'public/main.css',
    },
    jsImports: {
        js: 'public/main.js',
    },
    faviconFileName: 'public/favicon.png',
    defaultMetadata: {
        title: 'viralexplained.com',
        description: 'Why videos go viral, why videos don\'t',
        keywords: 'viral, videos, tiktok, instagram, youtube, social media', 
        author: 'viralexplained.com',
        imageUrl: 'https://www.viralexplained.com/public/site.png',
        language: 'en_US',
    },
    htmlTemplates: [
        {
            key: 'main',
            path: path.resolve(__dirname, '../site-test-assets/main.html'),
            isDefault: true,
        },
    ],
};

buildWebsite(website);
