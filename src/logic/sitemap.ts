import fs from 'fs';
import path from 'path';

import { BuiltPage, Website } from '../types';

export function renderSitemap(website: Website, pages: BuiltPage[]) {
    console.log('Rendering sitemap...');

    const { robotsContent, sitemapContent} = getSitemap(website, pages);
    
    saveFile(website, 'sitemap.txt', sitemapContent);
    saveFile(website, 'robots.txt', robotsContent);

    console.log('Done rendering sitemap.');
}

function getSitemap(website: Website, pages: BuiltPage[]) {
    const robotsContent = `Sitemap: ${website.url}/sitemap.txt`;
    const { legacyPaths = [] } = website;

    const allSlugs = [
        ...pages.map(p => p.slug),
        ...legacyPaths,
    ];

    const sitemapContent = allSlugs.map(slug => getPageUrl(website, slug)).join('\n');

    return {
        robotsContent,
        sitemapContent,
    }
}

function getPageUrl(website: Website, slug: string) {
    return `${website.url}${slug}`;
}

const saveFile = (website: Website, filePath: string, output: string) => {
    const { outputDirectoryPath } = website;
    const targetPath = path.resolve(outputDirectoryPath, filePath);

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, output);
}
