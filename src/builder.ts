import { getBuiltPages, renderHtmlFiles } from './logic/page-builder';
import { copyPublicAssets } from './logic/public-assets';
import { getSitePages } from './logic/site';
import { renderSitemap } from './logic/sitemap';
import { Website } from './types';

export const buildWebsite = (website: Website) => {
    console.log('Building website...');
    
    const pages = getSitePages(website);
    const builtPages = getBuiltPages(website, pages);
 
    renderHtmlFiles(website, builtPages);
    renderSitemap(website, builtPages);
    copyPublicAssets(website);

    console.log('Done building website.');
}
