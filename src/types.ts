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

export type imageUploadFunction = (
  blobInfo: any,
  success: Function,
  failure: Function,
) => void;

export type onChangeFunction = (updatedHTMLString: string) => void;

export type Extension = {
  name: string;
  component?: Function;
  onClick?: () => void; // Refined the type to indicate a no-argument function returning void
  isActive?: Function;
  icon?: string;
  iconElement?: any;
};

export type JSONNode = {
  type: string;
  content?: string;
  format?: string;
  href?: string;
  children?: JSONNode[];
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

export interface LinkProps {
  href: string;
  target: string;
}

export interface ILinkManager {
  findClosestAnchor(): HTMLAnchorElement | null;
  createLink(props: LinkProps): void;
  updateLink(props: LinkProps): void;
  removeLink(): void;
  getLinkProps(): LinkProps | null;
  isYouTubeIframeVideo(element: HTMLElement): boolean;
}
