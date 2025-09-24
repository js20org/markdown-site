import { getParsedSchemaValue, getValidatedSchema, validateBySchema } from '@js20/schema';
import { BuiltPage, Command, CommandProps, DefinedArgsCommand, MarkdownCodeDividerNode, MarkdownCodeNode, MarkdownNode, MarkdownNodeType, MarkdownTableNode, MarkdownTagNode, MarkdownTextNode, MarkdownTree, Page, PluginProps, PluginRuleDocument, PluginRuleNode, Position, Website } from '../types';
import { getTextNode } from './markdown-parser';

export const getCompiledMarkdown = (website: Website, pages: BuiltPage[], page: BuiltPage): MarkdownTree => {
    const { tree } = page;

    const commandProps: CommandProps = {
        website,
        pages,
    };

    const pluginProps: PluginProps = {
        website,
        page,
        allPages: pages,
    };

    const withoutAbundantSpaces = getWithoutAbundantSpaces(tree.nodes);
    const withSpecialCharacters = getWithSpecialCharacters(withoutAbundantSpaces);
    const withCode = getWithCode(withSpecialCharacters);
    const withProcessedCommands = getWithProcessedCommands(commandProps, withCode);
    const withLists = getWithLists(withProcessedCommands);
    const withTables = getWithTables(withLists);
    const withQuotes = getWithQuotes(withTables);
    const withPlugins = getWithPlugins(pluginProps, withQuotes);

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
    argsMap: Record<string, string | null>
) => {
    const result: any = {};

    for (const key in schema) {
        result[key] = getParsedSchemaValue(schema[key], argsMap[key]);
    }

    return result;
}

const getValidatedArgs = (argsKeys: string[], args: any[], argsSchema: any) => {
    const argsMap: Record<string, string | null> = {};

    for (let i = 0; i < argsKeys.length; i++) {
        const key = argsKeys[i] as string;
        const value = args[i] ?? null;

        argsMap[key] = value;
    }

    const hasArgs = args.length > 0;
    const validatedSchema = hasArgs ? getValidatedSchema(argsSchema) : null;
    const parsedArgs = hasArgs ? getParsedData(argsSchema, argsMap) : null;

    if (validatedSchema) {
        validateBySchema(validatedSchema, parsedArgs);
    }

    return parsedArgs;
}

const getTransformedCommandNode = (
    commandProps: CommandProps,
    node: MarkdownNode
): MarkdownNode => {
    const tagNode = node as MarkdownTagNode;
    const firstChild = tagNode.children?.[0] as MarkdownTextNode | undefined;
    const commandRawText = firstChild?.content || '';

    const parts = commandRawText.match(/"([^"]+)"|[^\s"]+/g) || [];
    const [commandId, ...args] = parts.map(s => s.replace(/^"|"$/g, ''));

    if (!commandId) {
        throw new Error('Command node did not have a command identifier');
    }

    const websiteCommands = commandProps.website.commands || [];
    const command = websiteCommands.find((c) => c.id === commandId);

    if (!command) {
        throw new Error(`Command with id "${commandId}" not found, did you provide it in your website configuration?`);
    }

    const definedCommand = command as DefinedArgsCommand<any>;
    const hasArgsDefinition = !!definedCommand.argsKeys && !!definedCommand.argsSchema;
    const parsedArgs = hasArgsDefinition ? getValidatedArgs(definedCommand.argsKeys as string[], args, definedCommand.argsSchema) : args;

    const output = command.run(commandProps, parsedArgs);
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

function getWithPlugins(props: PluginProps, nodes: MarkdownNode[]): MarkdownNode[] {
    const result: MarkdownNode[] = [];

    const { website, page } = props;
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
                const nodeRule = rule as PluginRuleNode;

                if (!nodeRule.type) {
                    continue;
                }
                
                const isTypeMatch = nodeRule.type === node.type;

                if (!isTypeMatch) {
                    continue;
                }

                const content = getTextNode(rule.getContent(props));
                
                const isBefore = rule.position === Position.beforeEachNode;
                const isAfter = rule.position === Position.afterEachNode;

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

    for (const plugin of plugins) {
        const isSlugMatch = page.slug.startsWith(plugin.slugStart);

        if (!isSlugMatch) {
            continue;
        }

        for (const rule of plugin.rules) {
            const documentRule = rule as PluginRuleDocument;
            const isAfterDocument = documentRule.position === Position.afterDocument;

            if (isAfterDocument) {
                const content = getTextNode(rule.getContent(props));
                result.push(content);
            }
        }
    }

    return result;
}

function getWithQuotes(nodes: MarkdownNode[]): MarkdownNode[] {
    const result: MarkdownNode[] = [];

    function applyIfNeeded() {
        if (currentQuoteNode) {
            result.push(currentQuoteNode);
            currentQuoteNode = null;
        }
    }

    let currentQuoteNode: MarkdownTagNode | null = null;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const { type } = node;
        
        const isQuoteLine = type === MarkdownNodeType.quoteLine;

        if (!isQuoteLine) {
            applyIfNeeded();
            result.push(node);
            continue;
        }

        if (!currentQuoteNode) {
            currentQuoteNode = {
                type: MarkdownNodeType.quote,
                children: [],
            };
        }
        
        currentQuoteNode.children.push(node);
    }

    applyIfNeeded();
    return result;
}

function getWithCode(nodes: MarkdownNode[]): MarkdownNode[] {
    const result: MarkdownNode[] = [];

    function applyIfNeeded() {
        if (codeNode) {
            result.push(codeNode);
            codeNode = null;
        }
    }

    let codeNode: MarkdownCodeNode | null = null;

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const { type } = node;
        
        const isCodeNode = [MarkdownNodeType.codeDivider, MarkdownNodeType.codeLine].includes(type);

        if (!isCodeNode) {
            applyIfNeeded();
            result.push(node);
            continue;
        }

        if (!codeNode) {
            const language = (node as MarkdownCodeDividerNode).extraContent;

            codeNode = {
                type: MarkdownNodeType.code,
                lines: [],
                language,
            };
        }
        
        const isLine = type === MarkdownNodeType.codeLine;

        if (isLine) {
            codeNode.lines.push(node);
        }
    }

    applyIfNeeded();
    return result;
}
