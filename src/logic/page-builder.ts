import fs from 'fs';
import path from 'path';
import { BuiltPage, CommandProps, Page, Website } from '../types';
import { getOutputByTemplate, getTemplates } from './html-templates';
import { getCompiledMarkdown } from './markdown-compiler';
import { getHtmlFromMarkdownTree } from './html-builder';
import { getParsedMarkdown } from './markdown-parser';
import { getMetadata } from './metadata';
import { getInnerText } from './text-builder';
import { getExpectedReadTime } from './expected-read-time';

export const renderHtmlFiles = (
    website: Website,
    pages: BuiltPage[]
) => {
    createOutputDirectoryIfNeeded(website);
    const { templatesMap, defaultTemplateKey } = getTemplates(website);

    console.log('Rendering HTML files...');

    const commandProps: CommandProps = {
        website,
        pages,
    };

    for (const page of pages) {
        const markdownTree = getCompiledMarkdown(commandProps, page);
        const htmlContent = getHtmlFromMarkdownTree(markdownTree);
        const output = getOutputByTemplate(
            website,
            page,
            templatesMap,
            defaultTemplateKey,
            htmlContent
        );

        const outputFilePath = saveFile(website, page, output);

        console.log(`> Rendered: ${outputFilePath}`);
    }

    console.log('Done rendering HTML files.');
}

const saveFile = (website: Website, page: Page, output: string) => {
    const { outputDirectoryPath } = website;
    const { fileName, relativeDirectoryPath } = page;

    const targetFileName = `${fileName}.html`;
    const relativeTargetPath = path.join(relativeDirectoryPath, targetFileName);
    const targetPath = path.resolve(outputDirectoryPath, relativeTargetPath);

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, output);

    return relativeTargetPath;
}

export const getBuiltPages = (website: Website, pages: Page[]): BuiltPage[] => {
    return pages.map((page) => {
        const rawContent = getPageContent(page.filePath);
        const tree = getParsedMarkdown(website, rawContent);
        const metadata = getMetadata(page.relativePath, tree);
        const innerText = getInnerText(tree.nodes);
        const expectedReadTime = getExpectedReadTime(innerText);

        return {
            ...page,
            tree,
            metadata,
            expectedReadTime,
        };
    });
}

const getPageContent = (filePath: string) => {
    return fs.readFileSync(filePath, 'utf8').toString();
}

const createOutputDirectoryIfNeeded = (website: Website) => {
    const { outputDirectoryPath } = website;

    if (!fs.existsSync(outputDirectoryPath)) {
        fs.mkdirSync(outputDirectoryPath);
    }
}
