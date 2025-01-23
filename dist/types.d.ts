export type BlockType = "text" | "code" | "image" | "headline1" | "headline2" | "headline3" | "html";
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
    iconName?: string;
};
