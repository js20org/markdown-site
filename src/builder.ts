import { getBuiltPages, renderHtmlFiles } from './logic/page-builder.js';
import { copyPublicAssets } from './logic/public-assets.js';
import { getSitePages } from './logic/site.js';
import { renderSitemap } from './logic/sitemap.js';
import { type Website } from './types.js';

export const buildWebsite = (website: Website) => {
    console.log('Building website...');
    
    const pages = getSitePages(website);
    const builtPages = getBuiltPages(website, pages);
 
    renderHtmlFiles(website, builtPages);
    renderSitemap(website, builtPages);
    copyPublicAssets(website);

    console.log('Done building website.');
}
