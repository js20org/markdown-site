import { MarkdownAnchorNode, MarkdownImageNode, MarkdownNode, MarkdownNodeType, MarkdownTableNode, MarkdownTextNode, MarkdownTree } from '../types';

export function getHtmlFromMarkdownTree(tree: MarkdownTree): string {
    return getRenderedNodeList(tree.nodes);
}

export function getRenderedNodeList(nodes: MarkdownNode[]): string {
    return nodes.map(n => getRenderedNode(n)).join('');
}

function getRenderedNode(node: MarkdownNode): string {
    switch (node.type) {
        case MarkdownNodeType.h1:
            return `<h1>${getRenderedNodeList(node.children)}</h1>`;
        case MarkdownNodeType.h2:
            return `<h2>${getRenderedNodeList(node.children)}</h2>`;
        case MarkdownNodeType.h3:
            return `<h3>${getRenderedNodeList(node.children)}</h3>`;
        case MarkdownNodeType.h4:
            return `<h4>${getRenderedNodeList(node.children)}</h4>`;
        case MarkdownNodeType.h5:
            return `<h5>${getRenderedNodeList(node.children)}</h5>`;
        case MarkdownNodeType.space:
            return '<br>';
        case MarkdownNodeType.paragraph:
            return `<p>${getRenderedNodeList(node.children)}</p>`;
        case MarkdownNodeType.underline:
            return `<u>${getRenderedNodeList(node.children)}</u>`;
        case MarkdownNodeType.bold:
            return `<b>${getRenderedNodeList(node.children)}</b>`;
        case MarkdownNodeType.italic:
            return `<i>${getRenderedNodeList(node.children)}</i>`;
        case MarkdownNodeType.text:
            return (node as MarkdownTextNode).content;
        case MarkdownNodeType.metadata:
            return '';
        case MarkdownNodeType.image:
            return getImage(node as MarkdownImageNode);
        case MarkdownNodeType.anchor:
            return getAnchor(node as MarkdownAnchorNode);
        case MarkdownNodeType.orderedList:
            return `<ol>${getRenderedNodeList(node.children)}</ol>`;
        case MarkdownNodeType.unorderedList:
            return `<ol>${getRenderedNodeList(node.children)}</ol>`;
        case MarkdownNodeType.orderedListItem:
        case MarkdownNodeType.unorderedListItem:
            return `<li>${getRenderedNodeList(node.children)}</li>`
        case MarkdownNodeType.table:
            return getTable(node as MarkdownTableNode);
        case MarkdownNodeType.tableRow:
            return `<tr>${getRenderedNodeList(node.children)}</tr>`;
        case MarkdownNodeType.tableCell:
            return `<td>${getRenderedNodeList(node.children)}</td>`;
        case MarkdownNodeType.tableCellHeader:
            return `<th>${getRenderedNodeList(node.children)}</th>`;
        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}

function getImage({ src, alt }: MarkdownImageNode): string {
    return `<div class="imageWrapper"><img src="${src}" alt="${alt}" /><label>${alt}</label></div>`;
}

function getAnchor(node: MarkdownAnchorNode): string {
    const ariaLabel = `Link to url ${node.href}`;

    return `<a href="${node.href}" aria-label="${ariaLabel}" target="${node.target}">${node.content}</a>`;
}

function getTable(node: MarkdownTableNode): string {
    const hasHeader = node.headerRows.length > 0;
    const hasBody = node.bodyRows.length > 0;

    const header = hasHeader ? `<thead>${getRenderedNodeList(node.headerRows)}</thead>` : '';
    const body = hasBody ? `<tbody>${getRenderedNodeList(node.bodyRows)}</tbody>` : '';

    return `<table>${header}${body}</table>`;
}
