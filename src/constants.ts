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
    defaultContent: "Heading 1",
    description: "Big section heading.",
    toolbar: "type | font | italic underline strikethrough | color",
    icon: "H1",
    availableTypes: [
      "text",
      "headline1",
      "headline2",
      "headline3",
      "code",
      "html",
    ],
  },
  headline2: {
    tag: "h2",
    visibleName: "Headline 2",
    blockName: BLOCK_TYPES.headline2,
    defaultContent: "Heading 2",
    description: "Medium section heading.",
    toolbar: "type | font | italic underline strikethrough | color",
    icon: "H2",
    availableTypes: [
      "text",
      "headline1",
      "headline2",
      "headline3",
      "code",
      "html",
    ],
  },
  headline3: {
    tag: "h3",
    visibleName: "Headline 3",
    blockName: BLOCK_TYPES.headline3,
    defaultContent: "Heading 3",
    description: "Small section heading.",
    toolbar: "type | font | italic underline strikethrough | color",
    icon: "H3",
    availableTypes: [
      "text",
      "headline1",
      "headline2",
      "headline3",
      "code",
      "html",
    ],
  },
  text: {
    tag: "p",
    visibleName: "Text",
    blockName: BLOCK_TYPES.text,
    description: "Just start writing with a simple text.",
    defaultContent: "Write something, or press '/' for commands...",
    toolbar:
      "type | font | bold [italic,underline,strikethrough] | [align] | color bgColor | viewCode",
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
    ],
  },
  image: {
    tag: "img",
    visibleName: "Image",
    blockName: BLOCK_TYPES.image,
    defaultContent: "",
    icon: "Photo",
    description: "Upload an image or embed it via link.",
    toolbar: "replaceImage | align",
    availableTypes: ["html"],
  },
  code: {
    tag: "code",
    visibleName: "Code",
    blockName: BLOCK_TYPES.code,
    defaultContent: "Write your code here...",
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
    ],
  },
  bulletedList: {
    tag: "ul",
    visibleName: "Bulleted list",
    blockName: BLOCK_TYPES.bulletedList,
    description: "Create a simple bulleted list",
    defaultContent: "List",
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
    defaultContent: "List",
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
    defaultContent: "Write something, or press '/' for commands...",
    toolbar:
      "type | font | bold italic underline strikethrough | color bgColor | viewCode",
    icon: "Article",
    availableTypes: ["text", "code"],
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
};

export const EVENTS = {
  blocksChanged: "typeblox.blocksChanged",
  styleChange: "typeblox.styleChanges",
  selectionChange: "typeblox.selectionChange",
};

export const allowedAttributes = [
  "data-id",
  "role",
  "aria-label",
  "alt",
  "title",
  "width",
  "height",
];
