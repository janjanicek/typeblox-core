import { BlockSettings, BlockType } from "./types";

export const BLOCK_TYPES: Record<string, string> = {
  text: "text",
  code: "code",
  image: "image",
  video: "video",
  headline1: "headline1",
  headline2: "headline2",
  headline3: "headline3",
  html: "html",
  bulletedList: "bulletedList",
  numberedList: "numberedList",
  blockquote: "blockquote",
  columns: "columns",
};

export const blocksWithoutSelection = [
  BLOCK_TYPES.image,
  BLOCK_TYPES.video,
  BLOCK_TYPES.columns,
];

export function addBlockType(blockName: string, blockKey: string) {
  BLOCK_TYPES[blockName] = blockKey;
}

export function removeBlockType(blockName: string) {
  delete BLOCK_TYPES[blockName];
}

export const AVAILABLE_BLOCKS: BlockType[] = [
  "text",
  "code",
  "image",
  "video",
  "headline1",
  "headline2",
  "headline3",
  "bulletedList",
  "numberedList",
  "blockquote",
  "html",
  "columns",
];

export function getAvailableBlocks(): string[] {
  return Object.values(BLOCKS_SETTINGS).map((block) => block.blockName);
}

export function getAvailableBlockTags(): string[] {
  const tags = Object.values(BLOCKS_SETTINGS).map((block) => block.tag);
  return Array.from(new Set(tags));
}

export function getBlockSettings(): Record<BlockType, BlockSettings> {
  return BLOCKS_SETTINGS;
}

export const DEFAULT_BLOCK_TYPE = "text";

export const BLOCKS_SETTINGS: Record<BlockType, BlockSettings> = {
  headline1: {
    tag: "h1",
    visibleName: "Headline 1",
    blockName: BLOCK_TYPES.headline1,
    placeholder: "Heading 1",
    contentPattern: (content: string) => `${content}`,
    description: "Big section heading.",
    toolbar:
      "type | font | italic underline strikethrough | align | color | clearFormatting",
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
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
  },
  headline2: {
    tag: "h2",
    visibleName: "Headline 2",
    blockName: BLOCK_TYPES.headline2,
    placeholder: "Heading 2",
    contentPattern: (content: string) => `${content}`,
    description: "Medium section heading.",
    toolbar:
      "type | font | italic underline strikethrough | align | color | clearFormatting",
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
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
  },
  headline3: {
    tag: "h3",
    visibleName: "Headline 3",
    blockName: BLOCK_TYPES.headline3,
    placeholder: "Heading 3",
    contentPattern: (content: string) => `${content}`,
    description: "Small section heading.",
    toolbar:
      "type | font | italic underline strikethrough | align | color | clearFormatting",
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
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
  },
  text: {
    tag: "p",
    visibleName: "Text",
    blockName: BLOCK_TYPES.text,
    description: "Just start writing with a simple text.",
    placeholder: "Write something, or press '/' for commands...",
    contentPattern: (content: string) => `${content}`,
    toolbar:
      "type | font | bold [italic,underline,strikethrough] | [align] | link | color bgColor | clearFormatting viewCode",
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
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
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
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
  },
  video: {
    tag: "iframe",
    visibleName: "YouTube Video",
    blockName: BLOCK_TYPES.video,
    placeholder: "",
    contentPattern: (content: string) => `${content}`,
    icon: "Video",
    description: "Embed YouTube video via link.",
    toolbar: "replaceVideo videoSettings | align",
    availableTypes: ["html"],
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
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
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
  },
  bulletedList: {
    tag: "ul",
    visibleName: "Bulleted list",
    blockName: BLOCK_TYPES.bulletedList,
    description: "Create a simple bulleted list",
    placeholder: "List",
    contentPattern: (content: string) => {
      return `<li>${content}</li>`;
    },
    toolbar:
      "type | font | bold italic underline strikethrough | link | color bgColor | clearFormatting viewCode",
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
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
  },
  numberedList: {
    tag: "ol",
    visibleName: "Numbered list",
    blockName: BLOCK_TYPES.numberedList,
    description: "Create a simple numbered list",
    placeholder: "List",
    contentPattern: (content: string) => `<li>${content}</li>`,
    toolbar:
      "type | font | bold italic underline strikethrough | link | color bgColor | clearFormatting viewCode",
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
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
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
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
  },
  columns: {
    tag: "div",
    visibleName: "Columns",
    blockName: BLOCK_TYPES.columns,
    description: "Type any content you want",
    placeholder: "",
    contentPattern: (content: string) => `${content}`,
    toolbar: "type",
    icon: "Columns2",
    availableTypes: [],
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
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
    defaults: {
      classes: "",
      attributes: "",
      styles: "",
    },
  },
};

export function updateBlockSettings(
  blockType: BlockType,
  updatedSettings: Partial<BlockSettings>,
) {
  if (BLOCKS_SETTINGS[blockType]) {
    BLOCKS_SETTINGS[blockType] = {
      ...BLOCKS_SETTINGS[blockType],
      ...updatedSettings, // Overwrite with the new values
    };
  } else {
    addNewBlockSettings(blockType, updatedSettings);
  }
}
const DEFAULT_BLOCK_DATA = {
  tag: "div",
  visibleName: "New block",
  blockName: "default",
  description: "This is a sample block description",
  placeholder: "Write your content",
  contentPattern: (content: string) => `${content}`,
  toolbar:
    "type | font | bold [italic,underline,strikethrough] | [align] | link | color bgColor | clearFormatting viewCode",
  icon: "Article",
  availableTypes: [
    "text",
    "html",
    "code",
    "headline1",
    "headline2",
    "headline3",
  ],
  defaults: {
    classes: "",
    attributes: "",
    styles: "",
  },
};
function addNewBlockSettings(
  blockType: BlockType,
  updatedSettings: Partial<BlockSettings>,
) {
  BLOCKS_SETTINGS[blockType] = {
    ...DEFAULT_BLOCK_DATA,
    ...updatedSettings, // Overwrite with the new values
  };
}

export function getToolbars(): Record<BlockType, string> {
  return Object.entries(BLOCKS_SETTINGS).reduce(
    (toolbars, [blockType, block]) => {
      toolbars[blockType as BlockType] = block.toolbar;
      return toolbars;
    },
    {} as Record<BlockType, string>,
  );
}
