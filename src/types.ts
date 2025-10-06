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
    cssImports?: Record<string, string>;
    jsImports?: Record<string, string>;
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
    template = 'template',
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

export interface MarkdownCodeDividerNode {
    type: MarkdownNodeType.codeDivider;
    extraContent: string;
}

export type MarkdownNode = MarkdownTagNode | MarkdownTextNode | MarkdownAnchorNode | MarkdownImageNode | MarkdownTableNode | MarkdownCodeDividerNode | MarkdownCodeNode;

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
    shortTitle?: string;
}

export interface BuiltPage extends Page {
    tree: MarkdownTree;
    metadata: Metadata;
    template?: string;
    expectedReadTime: string;
}

export interface CommandProps {
    website: Website;
    pages: BuiltPage[];
}

export type Primitive = string | number | boolean;
export type Command<T extends { [K in keyof T]: Primitive }> = RawArgsCommand | DefinedArgsCommand<T>;

export interface RawArgsCommand {
    id: string;
    run: (props: CommandProps, args: string[]) => string | undefined;
}

export interface DefinedArgsCommand<T extends { [K in keyof T]: Primitive }> {
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
    getContent: (props: PluginProps) => string;
}

export interface PluginRuleDocument {
    position: Position.afterDocument;
    getContent: (props: PluginProps) => string;
}

export type PluginRule = PluginRuleNode | PluginRuleDocument;

export interface PluginProps {
    website: Website;
    allPages: BuiltPage[];
    page: BuiltPage;
}
