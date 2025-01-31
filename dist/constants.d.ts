import { BlockType } from "./types";
export declare const AVAILABLE_FONTS: string[];
export declare const BLOCK_TYPES: any;
export declare const AVAILABLE_BLOCKS: BlockType[];
export declare const DEFAULT_BLOCK_TYPE = "text";
export declare const CLASSES: {
    selected: string;
};
export declare const BLOCKS_SETTINGS: {
    headline1: {
        tag: string;
        visibleName: string;
        blockName: any;
        placeholder: string;
        contentPattern: (content: string) => string;
        description: string;
        toolbar: string;
        icon: string;
        availableTypes: string[];
    };
    headline2: {
        tag: string;
        visibleName: string;
        blockName: any;
        placeholder: string;
        contentPattern: (content: string) => string;
        description: string;
        toolbar: string;
        icon: string;
        availableTypes: string[];
    };
    headline3: {
        tag: string;
        visibleName: string;
        blockName: any;
        placeholder: string;
        contentPattern: (content: string) => string;
        description: string;
        toolbar: string;
        icon: string;
        availableTypes: string[];
    };
    text: {
        tag: string;
        visibleName: string;
        blockName: any;
        description: string;
        placeholder: string;
        contentPattern: (content: string) => string;
        toolbar: string;
        icon: string;
        availableTypes: string[];
    };
    image: {
        tag: string;
        visibleName: string;
        blockName: any;
        placeholder: string;
        contentPattern: (content: string) => string;
        icon: string;
        description: string;
        toolbar: string;
        availableTypes: string[];
    };
    code: {
        tag: string;
        visibleName: string;
        blockName: any;
        placeholder: string;
        contentPattern: (content: string) => string;
        toolbar: string;
        icon: string;
        description: string;
        availableTypes: string[];
    };
    bulletedList: {
        tag: string;
        visibleName: string;
        blockName: any;
        description: string;
        placeholder: string;
        contentPattern: (content: string) => string;
        toolbar: string;
        icon: string;
        availableTypes: string[];
    };
    numberedList: {
        tag: string;
        visibleName: string;
        blockName: any;
        description: string;
        placeholder: string;
        contentPattern: (content: string) => string;
        toolbar: string;
        icon: string;
        availableTypes: string[];
    };
    html: {
        tag: string;
        visibleName: string;
        blockName: any;
        description: string;
        placeholder: string;
        contentPattern: (content: string) => string;
        toolbar: string;
        icon: string;
        availableTypes: string[];
    };
    blockquote: {
        tag: string;
        visibleName: string;
        blockName: any;
        description: string;
        placeholder: string;
        contentPattern: (content: string) => string;
        toolbar: string;
        icon: string;
        availableTypes: string[];
    };
};
export declare const DEFAULT_TOOLBARS: {
    text: string;
    image: string;
    code: string;
    headline1: string;
    headline2: string;
    headline3: string;
    html: string;
    numberedList: string;
    bulletedList: string;
    blockquote: string;
};
export declare const EVENTS: {
    blocksChanged: string;
    styleChange: string;
    selectionChange: string;
};
export declare const allowedAttributes: string[];
