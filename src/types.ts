export interface HtmlTemplate {
    key: string;
    path: string;
    isDefault?: boolean;
}

export interface Website {
    url: string;
    name: string;
    sitePath: string;
    publicPath?: string;
    outputDirectoryPath: string;
    htmlTemplates: HtmlTemplate[];
    cssFileName?: string;
    jsFileName?: string;
    faviconFileName?: string;
    legacyPaths?: string[];
    commands?: Command<any>[];
    defaultMetadata: Metadata;
    plugins?: Plugin[];
}

export interface Page {
    fileName: string;
    filePath: string;
    slug: string;
    extension: string;
    relativeDirectoryPath: string;
    relativePath: string;
    createdDate: Date;
}

export enum MarkdownNodeType {
    metadata = 'metadata',
    command = 'command',
    h1 ='h1',
    h2 = 'h2',
    h3 = 'h3',
    h4 = 'h4',
    h5 = 'h5',
    space = 'space',
    paragraph = 'paragraph',
    underline = 'underline',
    bold = 'bold',
    italic = 'italic',
    text = 'text',
    anchor = 'anchor',
    image = 'image',
    quoteLine = 'quoteLine',
    quote = 'quote',
    unorderedListItem = 'unorderedListItem',
    orderedListItem = 'orderedListItem',
    orderedList = 'orderedList',
    unorderedList = 'unorderedList',
    table = 'table',
    tableRow = 'tableRow',
    tableHeaderDivider = 'tableHeaderDivider',
    tableCell = 'tableCell',
    tableCellHeader = 'tableCellHeader',
    code = 'code',
    codeDivider = 'codeDivider',
    codeLine = 'codeLine',
}

export interface MarkdownAnchorNode {
    type: MarkdownNodeType.anchor;
    href: string;
    content: string;
    target: string;
}

export interface MarkdownImageNode {
    type: MarkdownNodeType.image;
    src: string;
    alt: string;
}

export interface MarkdownTagNode {
    type: MarkdownNodeType;
    children: MarkdownNode[];
}

export interface MarkdownCodeNode {
    type: MarkdownNodeType.code;
    lines: MarkdownNode[];
    language: string;
}

export interface MarkdownTableNode {
    type: MarkdownNodeType.table;
    headerRows: MarkdownNode[];
    bodyRows: MarkdownNode[];
}

export interface MarkdownTextNode {
    type: MarkdownNodeType.text;
    content: string;
}

export interface MarkdownMetadataNode {
    type: MarkdownNodeType.metadata;
    key: keyof Metadata;
    value: string;
}

export interface MarkdownCodeDividerNode {
    type: MarkdownNodeType.codeDivider;
    extraContent: string;
}

export type MarkdownNode = MarkdownTagNode | MarkdownTextNode | MarkdownMetadataNode | MarkdownAnchorNode | MarkdownImageNode | MarkdownTableNode | MarkdownCodeDividerNode | MarkdownCodeNode;

export interface MarkdownTree {
    nodes: MarkdownNode[];
}

export interface Metadata {
    title: string;
    description: string;
    keywords?: string;
    author?: string;
    imageUrl?: string;
    language?: string;
}

export interface BuiltPage extends Page {
    tree: MarkdownTree;
    metadata: Metadata;
    expectedReadTime: string;
}

export interface CommandProps {
    website: Website;
    pages: BuiltPage[];
}

export type Primitive = string | number | boolean;

export interface Command<T extends { [K in keyof T]: Primitive }> {
    id: string;
    argsKeys: (keyof T)[];
    argsSchema: T;
    run: (props: CommandProps, args: T) => string | undefined;
}

export interface Plugin {
    slugStart: string;
    rules: PluginRule[];
}

export enum Position {
    beforeEachNode = 'beforeEachNode',
    afterEachNode = 'afterEachNode',
    afterDocument = 'afterDocument',
}

export interface PluginRuleNode {
    type: MarkdownNodeType;
    position: Position.beforeEachNode | Position.afterEachNode;
    getContent: (page: BuiltPage) => string;
}

export interface PluginRuleDocument {
    position: Position.afterDocument;
    getContent: (page: BuiltPage) => string;
}

export type PluginRule = PluginRuleNode | PluginRuleDocument;
