export type BlockType = string;
export interface detectedStyles {
    color: string | null;
    backgroundColor: string | null;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    isStrikeout: boolean;
    fontFamily: string | null;
    isH1: boolean;
    isH2: boolean;
    isH3: boolean;
    isParagraph: boolean;
    isCode: boolean;
    isLink: boolean;
    textAlign: string | null;
}
export type CustomRange = {
    start: number;
    end: number;
};
export type imageUploadFunction = (blobInfo: any, success: Function, failure: Function) => void;
export type onChangeFunction = (updatedHTMLString: string) => void;
export type Extension = {
    name: string;
    component?: Function;
    onClick?: () => void;
    isActive?: Function;
    icon?: string;
    iconElement?: any;
};
export interface BlockDefaults {
    classes?: string;
    attributes?: string;
    styles?: string;
}
export interface BlockSettings {
    tag: string;
    visibleName: string;
    blockName: BlockType;
    placeholder: string;
    contentPattern: (content: string) => string;
    description: string;
    toolbar: string;
    icon?: string;
    iconElement?: any;
    availableTypes: string[];
    defaults: BlockDefaults;
}
export type EventCallback = (...args: any[]) => void;
