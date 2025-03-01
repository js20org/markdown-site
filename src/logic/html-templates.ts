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

    const withCssImports = getWithCssImports(template, website.cssImports);
    const withJsImports = getWithJsImports(withCssImports, website.jsImports);

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

    const result = withJsImports
        .replace(getReplaceKey('content'), content)
        .replace(getReplaceKey('favicon'), faviconLink)
        .replace(new RegExp(getReplaceKey('title'), 'g'), title)
        .replace(new RegExp(getReplaceKey('description'), 'g'), description)
        .replace(new RegExp(getReplaceKey('keywords'), 'g'), keywords)
        .replace(new RegExp(getReplaceKey('author'), 'g'), author)
        .replace(new RegExp(getReplaceKey('imageUrl'), 'g'), imageUrl)
        .replace(new RegExp(getReplaceKey('url'), 'g'), url)
        .replace(new RegExp(getReplaceKey('siteName'), 'g'), siteName)
        .replace(new RegExp(getReplaceKey('language'), 'g'), language);

    return getWithoutUnusedPlaceholders(result);
}

function getWithoutUnusedPlaceholders(content: string) {
    return content.replace(/\{\{.*?\}\}/g, '');
}

function getReplaceKey(key: string) {
    return `{{${key}}}`;
}

function getWithCssImports(content: string, imports?: Record<string, string>) {
    if (!imports) {
        return content;
    }

    let result = content;

    for (const [key, value] of Object.entries(imports)) {
        result = result.replace(new RegExp(getReplaceKey(key), 'g'), `<link rel="stylesheet" type="text/css" href="/${value}">`);
    }

    return result;
}

function getWithJsImports(content: string, imports?: Record<string, string>) {
    if (!imports) {
        return content;
    }

    let result = content;

    for (const [key, value] of Object.entries(imports)) {
        result = result.replace(new RegExp(getReplaceKey(key), 'g'), `<script src="/${value}"></script>`);
    }

    return result;
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