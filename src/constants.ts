import { BlockType } from "./types";

export const AVAILABLE_FONTS = [
  "Arial",
  "Courier",
  "Times New Roman",
  "Verdana",
  "Tahoma",
  "Impact",
];

export const BLOCK_TYPES: any = {
  text: "text",
  code: "code",
  image: "image",
  headline1: "headline1",
  headline2: "headline2",
  headline3: "headline3",
  html: "html",
  bulletedList: "bulletedList",
  numberedList: "numberedList",
  blockquote: "blockquote",
};

export const AVAILABLE_BLOCKS: BlockType[] = [
  "text",
  "code",
  "image",
  "headline1",
  "headline2",
  "headline3",
  "bulletedList",
  "numberedList",
  "blockquote",
  "html",
];

export const DEFAULT_BLOCK_TYPE = "text";

export const CLASSES = {
  selected: "typeblox-selected",
};

export const BLOCKS_SETTINGS = {
  headline1: {
    tag: "h1",
    visibleName: "Headline 1",
    blockName: BLOCK_TYPES.headline1,
    placeholder: "Heading 1",
    contentPattern: (content: string) => `${content}`,
    description: "Big section heading.",
    toolbar: "type | font | italic underline strikethrough | align | color",
    icon: "H1",
    availableTypes: [
      "text",
      "headline1",
      "headline2",
      "headline3",
      "code",
      "html",
      "blockquote",
    ],
  },
  headline2: {
    tag: "h2",
    visibleName: "Headline 2",
    blockName: BLOCK_TYPES.headline2,
    placeholder: "Heading 2",
    contentPattern: (content: string) => `${content}`,
    description: "Medium section heading.",
    toolbar: "type | font | italic underline strikethrough | align | color",
    icon: "H2",
    availableTypes: [
      "text",
      "headline1",
      "headline2",
      "headline3",
      "code",
      "html",
      "blockquote",
    ],
  },
  headline3: {
    tag: "h3",
    visibleName: "Headline 3",
    blockName: BLOCK_TYPES.headline3,
    placeholder: "Heading 3",
    contentPattern: (content: string) => `${content}`,
    description: "Small section heading.",
    toolbar: "type | font | italic underline strikethrough | align | color",
    icon: "H3",
    availableTypes: [
      "text",
      "headline1",
      "headline2",
      "headline3",
      "code",
      "html",
      "blockquote",
    ],
  },
  text: {
    tag: "p",
    visibleName: "Text",
    blockName: BLOCK_TYPES.text,
    description: "Just start writing with a simple text.",
    placeholder: "Write something, or press '/' for commands...",
    contentPattern: (content: string) => `${content}`,
    toolbar:
      "type | font | bold [italic,underline,strikethrough] | [align] | link | color bgColor | viewCode",
    icon: "AlignLeft",
    availableTypes: [
      "text",
      "headline1",
      "headline2",
      "headline3",
      "numberedList",
      "bulletedList",
      "code",
      "html",
      "blockquote",
    ],
  },
  image: {
    tag: "img",
    visibleName: "Image",
    blockName: BLOCK_TYPES.image,
    placeholder: "",
    contentPattern: (content: string) => `${content}`,
    icon: "Photo",
    description: "Upload an image or embed it via link.",
    toolbar: "replaceImage imageSettings | align",
    availableTypes: ["html"],
  },
  code: {
    tag: "code",
    visibleName: "Code",
    blockName: BLOCK_TYPES.code,
    placeholder: "Write your code here...",
    contentPattern: (content: string) => `${content}`,
    toolbar: "type",
    icon: "Code",
    description: "Write a code snippet.",
    availableTypes: [
      "text",
      "headline1",
      "headline2",
      "headline3",
      "code",
      "html",
      "blockquote",
    ],
  },
  bulletedList: {
    tag: "ul",
    visibleName: "Bulleted list",
    blockName: BLOCK_TYPES.bulletedList,
    description: "Create a simple bulleted list",
    placeholder: "List",
    contentPattern: (content: string) => {
      console.log("pattern");
      return `<li>${content}</li>`;
    },
    toolbar:
      "type | font | bold italic underline strikethrough | color bgColor",
    icon: "List",
    availableTypes: [
      "numberedList",
      "text",
      "headline1",
      "headline3",
      "headline3",
      "code",
      "html",
    ],
  },
  numberedList: {
    tag: "ol",
    visibleName: "Numbered list",
    blockName: BLOCK_TYPES.bulletedList,
    description: "Create a simple bulleted list",
    placeholder: "List",
    contentPattern: (content: string) => `<li>${content}</li>`,
    toolbar:
      "type | font | bold italic underline strikethrough | color bgColor",
    icon: "ListNumbers",
    availableTypes: [
      "bulletedList",
      "text",
      "headline1",
      "headline2",
      "headline3",
      "code",
      "html",
    ],
  },
  html: {
    tag: "div",
    visibleName: "Free content",
    blockName: BLOCK_TYPES.html,
    description: "Type any content you want",
    placeholder: "Write something, or press '/' for commands...",
    contentPattern: (content: string) => `${content}`,
    toolbar:
      "type | font | bold italic underline strikethrough | color bgColor | viewCode",
    icon: "Article",
    availableTypes: ["text", "code", "blockquote"],
  },
  blockquote: {
    tag: "blockquote",
    visibleName: "Quote",
    blockName: BLOCK_TYPES.blockquote,
    description: "Capture a quote",
    placeholder: "Write your quote",
    contentPattern: (content: string) => `${content}`,
    toolbar:
      "type | font | bold [italic,underline,strikethrough] | [align] | link | color bgColor | viewCode",
    icon: "Blockquote",
    availableTypes: ["text", "html", "code"],
  },
};

export const DEFAULT_TOOLBARS = {
  text: BLOCKS_SETTINGS["text"].toolbar,
  image: BLOCKS_SETTINGS["image"].toolbar,
  code: BLOCKS_SETTINGS["code"].toolbar,
  headline1: BLOCKS_SETTINGS["headline1"].toolbar,
  headline2: BLOCKS_SETTINGS["headline2"].toolbar,
  headline3: BLOCKS_SETTINGS["headline3"].toolbar,
  html: BLOCKS_SETTINGS["html"].toolbar,
  numberedList: BLOCKS_SETTINGS["numberedList"].toolbar,
  bulletedList: BLOCKS_SETTINGS["bulletedList"].toolbar,
  blockquote: BLOCKS_SETTINGS["blockquote"].toolbar,
};

export const EVENTS = {
  blocksChanged: "typeblox.blocksChanged",
  styleChange: "typeblox.styleChanges",
  selectionChange: "typeblox.selectionChange",
  historyChange: "typeblox.historyChange",
};

export const allowedAttributes = [
  "data-id",
  "data-test",
  "data-tbx-alignment",
  "data-tbx-block",
  "role",
  "id",
  "aria-label",
  "alt",
  "title",
  "width",
  "height",
];
