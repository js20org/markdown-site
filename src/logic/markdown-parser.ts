import { MarkdownNode, MarkdownNodeType, MarkdownTextNode, MarkdownTree, MarkdownAnchorNode, MarkdownTagNode, Website, MarkdownImageNode } from '../types';

export function getParsedMarkdown(website: Website, text: string): MarkdownTree {
    const lines = text.split('\n');
    const tree: MarkdownTree = {
        nodes: [],
    };

    for (const line of lines) {
        const { type, content } = getLineType(line);

        const isTableRow = type === MarkdownNodeType.tableRow;
        const children = isTableRow ? getTableCells(website, content) : getParsedContent(website, content);

        tree.nodes.push({
            type,
            children,
        });
    }

    return tree;
}

function getLineType(line: string): {
    type: MarkdownNodeType,
    content: string
} {
    const orderedListRegex = /^[0-9]+\. (.*)$/g;
    const orderedListMatch = orderedListRegex.exec(line);
    
    if (line.startsWith('$$ meta:')) {
        return {
            type: MarkdownNodeType.metadata,
            content: line.substring(8),
        };
    } else if (line.startsWith('$$ ')) {
        return {
            type: MarkdownNodeType.command,
            content: line.substring(3),
        };
    } else if (line.startsWith('# ')) {
        return {
            type: MarkdownNodeType.h1,
            content: line.substring(2)
        };
    } else if (line.startsWith('## ')) {
        return {
            type: MarkdownNodeType.h2,
            content: line.substring(3)
        };
    } else if (line.startsWith('### ')) {
        return {
            type: MarkdownNodeType.h3,
            content: line.substring(4)
        };
    } else if (line.startsWith('#### ')) {
        return {
            type: MarkdownNodeType.h4,
            content: line.substring(5)
        };
    } else if (line.startsWith('##### ')) {
        return {
            type: MarkdownNodeType.h5,
            content: line.substring(6)
        };
    } else if (line === '') {
        return {
            type: MarkdownNodeType.space,
            content: ''
        };
    } else if (line.startsWith('- ')) {
        return {
            type: MarkdownNodeType.unorderedListItem,
            content: line.substring(2)
        };
    } else if (line.startsWith('* ')) {
        return {
            type: MarkdownNodeType.unorderedListItem,
            content: line.substring(2)
        };
    } else if (orderedListMatch) {
        return {
            type: MarkdownNodeType.orderedListItem,
            content: orderedListMatch[1]
        };
    } else if (/^[|-]+$/.test(line)) {
        return {
            type: MarkdownNodeType.tableHeaderDivider,
            content: '',
        };
    } else if (line.startsWith('|')) {
        return {
            type: MarkdownNodeType.tableRow,
            content: line,
        };
    } else {
        return {
            type: MarkdownNodeType.paragraph,
            content: line
        };
    }
}

interface Pattern {
    getRegex: () => RegExp;
    type: MarkdownNodeType;
}

function getTableCells(website: Website, content: string): MarkdownNode[] {
    const result: MarkdownNode[] = [];
    const split = content.split('|');

    for (const item of split) {
        const trimmed = item.trim();

        if (!trimmed) {
            continue;
        }

        const children = getParsedContent(website, trimmed);

        result.push({
            type: MarkdownNodeType.tableCell,
            children,
        });
    }

    return result;
}

function getParsedContent(website: Website, content: string): MarkdownNode[] {
    const patterns: Pattern[] = [
        { getRegex: () => /(?<!\\)__(.+?)(?<!\\)__/, type: MarkdownNodeType.underline },
        { getRegex: () => /(?<!\\)(?:\*\*|__)(.+?)(?<!\\)(?:\*\*|__)/g, type: MarkdownNodeType.bold },
        { getRegex: () => /(?<!\\)(?:\*|_)(.+?)(?<!\\)(?:\*|_)/g, type: MarkdownNodeType.italic },
        { getRegex: () => /!\[([^\]]+)\]\(([^)]+)\)/g, type: MarkdownNodeType.image },
        { getRegex: () => /\[([^\]]+)\]\(([^)]+)\)/g, type: MarkdownNodeType.anchor },
    ];

    let currentNodes: MarkdownNode[] = [getTextNode(content)];

    for (const pattern of patterns) {
        currentNodes = getReplacedPattern(website, currentNodes, pattern);
    }

    return currentNodes;
}

function getReplacedPattern(website: Website, nodes: MarkdownNode[], pattern: Pattern): MarkdownNode[] {
    const result: MarkdownNode[] = [];

    for (const node of nodes) {
        const tagNode = node as MarkdownTagNode;
        const isTextNode = node.type === MarkdownNodeType.text;
        const hasChildren = tagNode.children;

        if (hasChildren) {
            const children = getReplacedPattern(website, tagNode.children, pattern);

            result.push({
                ...tagNode,
                children,
            });
        } else if (isTextNode) {
            const textNode = node as MarkdownTextNode;
            const regex = pattern.getRegex();
            const match = regex.exec(textNode.content);
            const isImage = pattern.type === MarkdownNodeType.image;
            const isAnchor = pattern.type === MarkdownNodeType.anchor;

            if (isImage && match) {
                result.push(getImageNode(match[2], match[1]));
            } else if (isAnchor && match) {
                result.push(getAnchorNode(website, match[2], match[1]));
            } else if (match) {
                const [_fullMatch, insideTag] = match;

                const startIndex = match.index;
                const before = textNode.content.slice(0, startIndex);
                const after = textNode.content.slice(startIndex + _fullMatch.length);

                if (before) {
                    result.push(getTextNode(before));
                }

                result.push({
                    type: pattern.type,
                    children: [
                        getTextNode(insideTag),
                    ],
                });

                if (after) {
                    result.push(...getReplacedPattern(website, [getTextNode(after)], pattern));
                }
            } else {
                result.push(textNode);
            }
        } else {
            result.push(node);
        }
    }

    return result;
}

function getImageNode(src: string, alt: string): MarkdownImageNode {
    return {
        type: MarkdownNodeType.image,
        src,
        alt,
    };
}

function getAnchorNode(website: Website, href: string, content: string): MarkdownAnchorNode {
    const { url } = website;
    const target = getTarget(url, href);

    return {
        type: MarkdownNodeType.anchor,
        href,
        content,
        target,
    };
}

function getTarget(url: string, href: string | undefined) {
    if (!href) {
        return '_blank';
    }

    try {
        const converted = new URL(href);
        const baseUrl = `${converted.protocol}//${converted.hostname}`;
        const isSameSite = baseUrl === url;
        
        return isSameSite ? '_self' : '_blank';
    } catch {
        return '_blank';
    }
    
}

export function getTextNode(text: string): MarkdownTextNode {
    return {
        type: MarkdownNodeType.text,
        content: text,
    };
}
