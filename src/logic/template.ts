import { MarkdownNode, MarkdownTagNode, MarkdownTextNode, MarkdownTree } from '../types';

export const getPageTemplate = (tree: MarkdownTree) => {
    const result: string[] = [];
    addToResult(result, tree.nodes);
    return result.length > 0 ? result[0] : undefined;
}

const addToResult = (result: string[], nodes: MarkdownNode[]) => {
    for (const node of nodes) {
        if (node.type === 'template') {
            const textNode = node.children[0] as MarkdownTextNode;
            result.push(textNode.content);
        }

        const tagNode = node as MarkdownTagNode;
        const children = tagNode.children || [];

        addToResult(result, children);
    }
}
