import { getParsedSchemaValue, getValidatedSchema, validateBySchema } from '@js20/schema';
import { BuiltPage, Command, CommandProps, MarkdownNode, MarkdownNodeType, MarkdownTableNode, MarkdownTagNode, MarkdownTextNode, MarkdownTree, Page, Position, Website } from '../types';
import { getTextNode } from './markdown-parser';

export const getCompiledMarkdown = (commandProps: CommandProps, page: BuiltPage): MarkdownTree => {
    const { tree } = page;

    const withoutAbundantSpaces = getWithoutAbundantSpaces(tree.nodes);
    const withSpecialCharacters = getWithSpecialCharacters(withoutAbundantSpaces);
    const withProcessedCommands = getWithProcessedCommands(commandProps, withSpecialCharacters);
    const withLists = getWithLists(withProcessedCommands);
    const withTables = getWithTables(withLists);
    const withPlugins = getWithPlugins(commandProps.website, page, withTables);

    return {
        ...tree,
        nodes: withPlugins,
    };
}

const getWithoutAbundantSpaces = (nodes: MarkdownNode[]): MarkdownNode[] => {
    //Only spaces between two paragraphs are needed
    const result: MarkdownNode[] = [];

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const previousNode = nodes[i - 1];
        const nextNode = nodes[i + 1];

        const isCurrentSpace = node.type === 'space';
        const tagNode = node as MarkdownTagNode;
        const isTagNode = !!tagNode.children;

        if (isCurrentSpace) {
            const isPreviousParagraph = previousNode?.type === MarkdownNodeType.paragraph;
            const isNextParagraph = nextNode?.type === MarkdownNodeType.paragraph;
            const isAllowedSpace = isPreviousParagraph && isNextParagraph;

            if (isAllowedSpace) {
                result.push(node);
            }
        } else if (isTagNode) {
            const nextChildren = getWithoutAbundantSpaces(tagNode.children);
            const nextTagNode = {
                ...tagNode,
                children: nextChildren
            };

            result.push(nextTagNode);
        } else {
            result.push(node);
        }
    }

    return result;
}

const getWithProcessedCommands = (
    commandProps: CommandProps,
    nodes: MarkdownNode[]
): MarkdownNode[] => {
    const result: MarkdownNode[] = [];

    for (const node of nodes) {
        const isCommand = node.type === MarkdownNodeType.command;
        const transformedNode = isCommand ? getTransformedCommandNode(commandProps, node) : node;
        const tagNode = transformedNode as MarkdownTagNode;
        const children = tagNode.children || [];
        const nextChildren = getWithProcessedCommands(commandProps, children);

        result.push({
            ...tagNode,
            children: nextChildren
        });
    }

    return result;
}

const getParsedData = (
    schema: any,
    argsMap: Record<string, string>
) => {
    const result: any = {};

    for (const key in schema) {
        result[key] = getParsedSchemaValue(schema[key], argsMap[key]);
    }

    return result;
}

const getTransformedCommandNode = (
    commandProps: CommandProps,
    node: MarkdownNode
): MarkdownNode => {
    const tagNode = node as MarkdownTagNode;
    const firstChild = tagNode.children?.[0] as MarkdownTextNode | undefined;
    const commandRawText = firstChild?.content || '';
    const [commandId, ...args] = commandRawText.split(' ');

    if (!commandId) {
        throw new Error('Command node did not have a command identifier');
    }

    const websiteCommands = commandProps.website.commands || [];
    const command = websiteCommands.find((c) => c.id === commandId);

    if (!command) {
        throw new Error(`Command with id "${commandId}" not found, did you provide it in your website configuration?`);
    }

    const { argsKeys, argsSchema, run } = command as Command<any>;
    const hasSameAmountOfArgs = argsKeys.length === args.length;

    if (!hasSameAmountOfArgs) {
        throw new Error(`Command "${commandId}" expects ${argsKeys.length} arguments, but got ${args.length}`);
    }

    const argsMap: Record<string, string> = {};

    for (let i = 0; i < argsKeys.length; i++) {
        const key = argsKeys[i] as string;
        const value = args[i];

        argsMap[key] = value;
    }

    const hasArgs = args.length > 0;
    const validatedSchema = hasArgs ? getValidatedSchema(argsSchema) : null;
    const parsedArgs = hasArgs ? getParsedData(argsSchema, argsMap) : null;

    if (validatedSchema) {
        validateBySchema(validatedSchema, parsedArgs);
    }

    const output = run(commandProps, parsedArgs);
    const safeOutput = output || '';

    return getTextNode(safeOutput);
}

const listMap = {
    [MarkdownNodeType.orderedListItem]: MarkdownNodeType.orderedList,
    [MarkdownNodeType.unorderedListItem]: MarkdownNodeType.unorderedList
}

function getWithLists(nodes: MarkdownNode[]): MarkdownNode[] {
    const result: MarkdownNode[] = [];

    function applyIfNeeded() {
        if (currentListNode) {
            result.push(currentListNode);
            currentListNode = null;
        }
    }

    let currentListNode: MarkdownTagNode | null = null;

    for (const node of nodes) {
        const { type } = node;

        const isListItem = [
            MarkdownNodeType.orderedListItem,
            MarkdownNodeType.unorderedListItem
        ].includes(type);
        
        if (!isListItem) {
            applyIfNeeded();
            result.push(node);
            continue;
        }

        const listType = (listMap as any)[type] as MarkdownNodeType;
        const isSameType = currentListNode && currentListNode.type === listType;

        if (isSameType) {
            currentListNode!.children.push(node);
        } else {
            applyIfNeeded();
            currentListNode = {
                type: listType,
                children: [node],
            };
        }
    }

    applyIfNeeded();

    return result;
}

function getWithTables(nodes: MarkdownNode[]): MarkdownNode[] {
    const result: MarkdownNode[] = [];

    function applyIfNeeded() {
        if (currentTableNode) {
            result.push(currentTableNode);
            currentTableNode = null;
        }
    }

    let currentTableNode: MarkdownTableNode | null = null;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const { type } = node;
        
        const isTableRelatedRow = [
            MarkdownNodeType.tableRow,
            MarkdownNodeType.tableHeaderDivider,
        ].includes(type);

        if (!isTableRelatedRow) {
            applyIfNeeded();
            result.push(node);
            continue;
        }

        if (!currentTableNode) {
            currentTableNode = {
                type: MarkdownNodeType.table,
                headerRows: [],
                bodyRows: [],
            };
        }

        const isDivider = type === MarkdownNodeType.tableHeaderDivider;

        if (isDivider) {
            continue;
        }

        const isFirstRow = currentTableNode.bodyRows.length === 0 && currentTableNode.headerRows.length === 0;
        const isNextDivider = nodes[i + 1]?.type === MarkdownNodeType.tableHeaderDivider;
        const isHeaderRow = isFirstRow && isNextDivider;

        if (isHeaderRow) {
            currentTableNode.headerRows.push(
                getConvertedHeaderCells(node as MarkdownTagNode)
            );
        } else {
            currentTableNode.bodyRows.push(node);
        }
    }

    applyIfNeeded();
    return result;
}

function getConvertedHeaderCells(node: MarkdownTagNode): MarkdownNode {
    const children = node.children as MarkdownTagNode[];

    const nextChildren = children.map((child) => {
        return ({
            ...child,
            type: MarkdownNodeType.tableCellHeader,
        })
    });

    return {
        ...node,
        children: nextChildren,
    };
}

function getWithSpecialCharacters(nodes: MarkdownNode[]): MarkdownNode[] {
    const result: MarkdownNode[] = [];

    for (const node of nodes) {
        const tagNode = node as MarkdownTagNode;
        const isTextNode = node.type === MarkdownNodeType.text;

        if (isTextNode) {
            const textNode = node as MarkdownTextNode;
            const withNoSlashes = textNode.content.replace(/\\(.)/g, '$1');
            const withHtml = getEscapeHtml(withNoSlashes);

            result.push({
                ...textNode,
                content: withHtml,
            });
        } else if (tagNode.children) {
            result.push({
                ...tagNode,
                children: getWithSpecialCharacters(tagNode.children),
            });
        } else {
            result.push(node);
        }
    }

    return result;
}

function getEscapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/`/g, '&#x60;');
}

function getWithPlugins(website: Website, page: BuiltPage, nodes: MarkdownNode[]): MarkdownNode[] {
    const result: MarkdownNode[] = [];

    const { plugins = [] } = website;

    for (const node of nodes) {
        let before: MarkdownNode | null = null;
        let after: MarkdownNode | null = null;

        for (const plugin of plugins) {
            const isSlugMatch = page.slug.startsWith(plugin.slugStart);

            if (!isSlugMatch) {
                continue;
            }

            for (const rule of plugin.rules) {
                const isTypeMatch = rule.type === node.type;

                if (!isTypeMatch) {
                    continue;
                }

                const content = getTextNode(rule.getContent(page));
                
                const isBefore = rule.position === Position.before;
                const isAfter = rule.position === Position.after;

                if (isBefore) {
                    before = content;
                } else if (isAfter) {
                    after = content;
                }
            }
        }

        if (before) {
            result.push(before);
        }

        result.push(node);

        if (after) {
            result.push(after);
        }
    }

    return result;
}
