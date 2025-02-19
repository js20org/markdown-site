import { MarkdownAnchorNode, MarkdownNode, MarkdownNodeType, MarkdownTagNode, MarkdownTextNode } from '../types';

export function getInnerText(nodes: MarkdownNode[]): string {
    return nodes.map(n => getRenderedNode(n)).join('');
}

function getRenderedNode(node: MarkdownNode): string {
    const isText = node.type === MarkdownNodeType.text;
    const isAnchor = node.type === MarkdownNodeType.anchor;

    if (isText) {
        return (node as MarkdownTextNode).content;
    } else if (isAnchor) {
        return (node as MarkdownAnchorNode).content;
    }

    const children = (node as MarkdownTagNode).children;

    if (children) {
        return getInnerText(children);
    } else {
        return '';
    }
}
