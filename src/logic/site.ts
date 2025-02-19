import fs from 'fs';
import path from 'path';
import { Page, Website } from '../types';

export const getSitePages = (website: Website): Page[] => {
    const { sitePath } = website;
    const allFilePaths = getAllFiles(sitePath);

    const pages: (Page | null)[] = allFilePaths.map(filePath => {
        const fileName = path.basename(filePath, path.extname(filePath));
        const extension = path.extname(filePath).replace('.', '');
        const relativeDirectoryPath = path.relative(sitePath, path.dirname(filePath));
        const createdDate = fs.statSync(filePath).birthtime;
        const relativePath = path.join(relativeDirectoryPath, fileName + '.' + extension);
        const slug = getSlug(relativeDirectoryPath, fileName);
        const isPage = extension === 'md';

        if (!isPage) {
            return null;
        }

        return {
            fileName,
            filePath,
            slug,
            extension,
            relativeDirectoryPath,
            relativePath,
            createdDate
        };
    });

    return pages.filter(page => page !== null) as Page[];
}

const getSlug = (relativeDirectoryPath: string, fileName: string) => {
    const isIndex = !relativeDirectoryPath && fileName === 'index';

    if (isIndex) {
        return '/';
    } else {
        return '/' + [relativeDirectoryPath, fileName].join('/');
    }
}

const getAllFiles = (directoryPath: string): string[] => {
    const result: string[] = [];
    const list = fs.readdirSync(directoryPath);
    
    for (const file of list) {
        const filePath = path.join(directoryPath, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            result.push(...getAllFiles(filePath));
        } else {
            result.push(filePath);
        }
    }

    return result;
}
