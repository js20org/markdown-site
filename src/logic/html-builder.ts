import { MarkdownAnchorNode, MarkdownCodeNode, MarkdownImageNode, MarkdownNode, MarkdownNodeType, MarkdownTableNode, MarkdownTextNode, MarkdownTree } from '../types';

export function getHtmlFromMarkdownTree(tree: MarkdownTree): string {
    return getRenderedNodeList(tree.nodes);
}

export function getRenderedNodeList(nodes: MarkdownNode[]): string {
    return nodes.map(n => getRenderedNode(n)).join('');
}

function getRenderedNode(node: MarkdownNode): string {
    switch (node.type) {
        case MarkdownNodeType.h1:
            return getHeader(node.children, 'h1');
        case MarkdownNodeType.h2:
            return getHeader(node.children, 'h2');
        case MarkdownNodeType.h3:
            return getHeader(node.children, 'h3');
        case MarkdownNodeType.h4:
            return getHeader(node.children, 'h4');
        case MarkdownNodeType.h5:
            return getHeader(node.children, 'h5');
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
        case MarkdownNodeType.template:
            return '';
        case MarkdownNodeType.image:
            return getImage(node as MarkdownImageNode);
        case MarkdownNodeType.anchor:
            return getAnchor(node as MarkdownAnchorNode);
        case MarkdownNodeType.orderedList:
            return `<ol>${getRenderedNodeList(node.children)}</ol>`;
        case MarkdownNodeType.unorderedList:
            return `<ul>${getRenderedNodeList(node.children)}</ul>`;
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
        case MarkdownNodeType.quote:
            return `<blockquote>${getQuote(node.children)}</blockquote>`;
        case MarkdownNodeType.quoteLine:
            return getRenderedNodeList(node.children);
        case MarkdownNodeType.code:
            return getCode(node as MarkdownCodeNode);
        case MarkdownNodeType.codeLine:
            return getRenderedNodeList(node.children);
        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}

function getHeader(children: MarkdownNode[], tag: string): string {
    const content = getRenderedNodeList(children);
    const id = content.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');

    return `<${tag} id="${id}">${content}</${tag}>`;
}

function getCode({ lines, language }: MarkdownCodeNode): string {
    const content = lines.map(l => getRenderedNode(l)).join('\n');
    const classExtra = language ? ` class="language-${language}"` : '';

    return `<pre${classExtra}><code>${content}</code></pre>`;
}

function getQuote(children: MarkdownNode[]): string {
    const result = [];

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const isLast = i === children.length - 1;

        result.push(getRenderedNode(child));

        if (!isLast) {
            result.push('<br>');
        }
    }

    return result.join('');
}

function getImage({ src, alt }: MarkdownImageNode): string {
    return `<div class="image-wrapper"><img src="${src}" alt="${alt}" /><label>${alt}</label></div>`;
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
