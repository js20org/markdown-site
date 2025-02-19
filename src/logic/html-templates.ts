import fs from 'fs';
import { BuiltPage, HtmlTemplate, Metadata, Website } from '../types';

type TemplatesMap = Record<string, string>;

export const getOutputByTemplate = (
    website: Website,
    page: BuiltPage,
    templatesMap: TemplatesMap,
    defaultTemplateKey: string,
    content: string,
) => {
    const { defaultMetadata } = website;
    const { metadata } = page;

    const chosenTemplate = defaultTemplateKey;
    const template = templatesMap[chosenTemplate];

    const cssLink = website.cssFileName
        ? `<link rel="stylesheet" type="text/css" href="/${website.cssFileName}">`
        : '';

    const jsScript = website.jsFileName
        ? `<script src="/${website.jsFileName}"></script>`
        : '';

    const faviconFileName = website.faviconFileName || 'favicon.ico';
    const faviconLink = `<link rel="icon" type="image/png" href="/${faviconFileName}" />`;

    const title = getMetadataValue('title', metadata, defaultMetadata);
    const description = getMetadataValue('description', metadata, defaultMetadata);
    const keywords = getMetadataValue('keywords', metadata, defaultMetadata);
    const author = getMetadataValue('author', metadata, defaultMetadata);
    const imageUrl = getMetadataValue('imageUrl', metadata, defaultMetadata);
    const language = getMetadataValue('language', metadata, defaultMetadata);
    const url = `${website.url}${page.slug}`;
    const siteName = website.name;

    return template
        .replace('<!--content-->', content)
        .replace('<!--css-->', cssLink)
        .replace('<!--js-->', jsScript)
        .replace('<!--favicon-->', faviconLink)
        .replace(new RegExp('<!--title-->', 'g'), title)
        .replace(new RegExp('<!--description-->', 'g'), description)
        .replace(new RegExp('<!--keywords-->', 'g'), keywords)
        .replace(new RegExp('<!--author-->', 'g'), author)
        .replace(new RegExp('<!--imageUrl-->', 'g'), imageUrl)
        .replace(new RegExp('<!--url-->', 'g'), url)
        .replace(new RegExp('<!--siteName-->', 'g'), siteName)
        .replace(new RegExp('<!--language-->', 'g'), language);
}

function getMetadataValue(key: keyof Metadata, metadata: Metadata, defaultMetadata: Metadata) {
    return metadata[key] || defaultMetadata[key] || '';
}

export const getTemplates = (website: Website) => {
    const { htmlTemplates } = website;

    const templatesMap = getTemplatesMap(htmlTemplates);
    const defaultTemplateKey = htmlTemplates.find(
        (template) => template.isDefault
    )?.key;

    if (!defaultTemplateKey) {
        throw new Error('Default html template not found');
    }

    return {
        templatesMap,
        defaultTemplateKey,
    };
};

const getTemplatesMap = (htmlTemplates: HtmlTemplate[]) => {
    const templatesMap: TemplatesMap = {};

    for (const { key, path } of htmlTemplates) {
        const content = fs.readFileSync(path, 'utf8').toString();
        templatesMap[key] = content;
    }

    return templatesMap;
};