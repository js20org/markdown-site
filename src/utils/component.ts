import fs from 'fs';
import path from 'path';

export function getComponent(relativePath: string, replaceMap: Record<string, string>) {
    const fullPath = path.resolve(process.cwd(), relativePath);
    const content = fs.readFileSync(fullPath, 'utf-8').toString();

    let newContent = content;

    for (const key in replaceMap) {
        newContent = newContent.replace(new RegExp(key, 'g'), replaceMap[key]);
    }

    return newContent;
}
