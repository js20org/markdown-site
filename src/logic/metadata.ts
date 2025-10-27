import { type MarkdownNode, MarkdownNodeType, type MarkdownTagNode, type MarkdownTree, type Metadata } from '../types.js';
import { getRenderedNodeList } from './html-builder.js';

const requiredMetadataKeys: (keyof Metadata)[] = [
    'title',
    'description',
];

const optionalMetadataKeys: (keyof Metadata)[] = [
    'keywords',
    'author',
    'imageUrl',
    'language',
    'shortTitle',
];

const metadataKeys = [...requiredMetadataKeys, ...optionalMetadataKeys];

export const getMetadata = (pagePath: string, tree: MarkdownTree): Metadata => {
    const metadata: Partial<Metadata> = {};
    
    addToMetadata(metadata, tree.nodes)
    verifyHasAllMetadata(pagePath, metadata);

    return metadata as Metadata;
}

const verifyHasAllMetadata = (pagePath: string, metadata: Partial<Metadata>) => {
    for (const key of requiredMetadataKeys) {
        if (!metadata[key]) {
            throw new Error(`Page "${pagePath}" is missing required metadata key: ${key}`);
        }
    }
}

const addToMetadata = (metadata: Partial<Metadata>, nodes: MarkdownNode[]) => {
    for (const node of nodes) {
        const tagNode = node as MarkdownTagNode;
        const children = tagNode.children || [];

        processNode(metadata, node);
        addToMetadata(metadata, children);
    }
}

const processNode = (metadata: Partial<Metadata>, node: MarkdownNode) => {
    const isMetadata = node.type === 'metadata';
    const isH1 = node.type === MarkdownNodeType.h1;

    if (isMetadata) {
        processMetadataNode(metadata, node as MarkdownTagNode);
    } else if (isH1) {
        metadata.title = getRenderedNodeList(node.children);
    }
}

const processMetadataNode = (metadata: Partial<Metadata>, node: MarkdownTagNode) => {
    for (const key of metadataKeys) {
        const keyDivider = `${key} `;
        const content = getRenderedNodeList(node.children);
        const hasKey = content.startsWith(keyDivider);

        if (hasKey) {
            const value = content.replace(keyDivider, '');
            metadata[key] = value;
        }
    }
}