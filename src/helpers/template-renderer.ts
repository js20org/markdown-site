import fs from 'fs';
import path from 'path';

export class TemplateRenderer {
    private basePath: string;

    constructor(basePath: string) {
        this.basePath = basePath;
    }

    getTemplate(slug: string, variables: Record<string, string> = {}) {
        const fullPath = path.join(this.basePath, slug);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`Template not found: ${slug}`);
        }

        let result = fs.readFileSync(fullPath, 'utf-8').toString();

        for (const key in variables) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
        }

        return result;
    }
}
