"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENTS =
  exports.DEFAULT_TOOLBARS =
  exports.BLOCKS_SETTINGS =
  exports.CLASSES =
  exports.DEFAULT_BLOCK_TYPE =
  exports.AVAILABLE_BLOCKS =
  exports.BLOCK_TYPES =
  exports.AVAILABLE_FONTS =
    void 0;
exports.AVAILABLE_FONTS = [
  "Arial",
  "Courier",
  "Times New Roman",
  "Verdana",
  "Tahoma",
  "Impact",
];
exports.BLOCK_TYPES = {
  text: "text",
  code: "code",
  image: "image",
  headline1: "headline1",
  headline2: "headline2",
  headline3: "headline3",
  html: "html",
};
exports.AVAILABLE_BLOCKS = [
  "text",
  "code",
  "image",
  "headline1",
  "headline2",
  "headline3",
  "html",
];
exports.DEFAULT_BLOCK_TYPE = "text";
exports.CLASSES = {
  selected: "typeblox-selected",
};
exports.BLOCKS_SETTINGS = {
  headline1: {
    tag: "h1",
    visibleName: "Headline 1",
    blockName: exports.BLOCK_TYPES.headline1,
    defaultContent: "Heading 1",
    description: "Big section heading.",
    toolbar: "type | font | italic underline strikethrough | color",
    icon: "h1",
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
    blockName: exports.BLOCK_TYPES.headline2,
    defaultContent: "Heading 2",
    description: "Medium section heading.",
    toolbar: "type | font | italic underline strikethrough | color",
    icon: "h2",
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
    blockName: exports.BLOCK_TYPES.headline3,
    defaultContent: "Heading 3",
    description: "Small section heading.",
    toolbar: "type | font | italic underline strikethrough | color",
    icon: "h3",
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
    blockName: exports.BLOCK_TYPES.text,
    description: "Just start writing with a simple text.",
    defaultContent: "Write something, or press '/' for commands...",
    toolbar:
      "type | font | bold italic underline strikethrough | color bgColor | viewCode",
    icon: "alignLeft",
    availableTypes: [
      "text",
      "headline1",
      "headline2",
      "headline3",
      "code",
      "html",
    ],
  },
  image: {
    tag: "img",
    visibleName: "Image",
    blockName: exports.BLOCK_TYPES.image,
    defaultContent: "",
    toolbar: "size",
    icon: "photo",
    description: "Upload an image or embed it via link.",
    availableTypes: ["html"],
  },
  code: {
    tag: "code",
    visibleName: "Code",
    blockName: exports.BLOCK_TYPES.code,
    defaultContent: "Write your code here...",
    toolbar: "type",
    icon: "code",
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
  html: {
    tag: "div",
    visibleName: "Free content",
    blockName: exports.BLOCK_TYPES.html,
    description: "Type any content you want",
    defaultContent: "Write something, or press '/' for commands...",
    toolbar:
      "type | font | bold italic underline strikethrough | color bgColor | viewCode",
    icon: "article",
    availableTypes: ["text", "code"],
  },
};
exports.DEFAULT_TOOLBARS = {
  text: exports.BLOCKS_SETTINGS["text"].toolbar,
  image: exports.BLOCKS_SETTINGS["image"].toolbar,
  code: exports.BLOCKS_SETTINGS["code"].toolbar,
  headline1: exports.BLOCKS_SETTINGS["headline1"].toolbar,
  headline2: exports.BLOCKS_SETTINGS["headline2"].toolbar,
  headline3: exports.BLOCKS_SETTINGS["headline3"].toolbar,
  html: exports.BLOCKS_SETTINGS["html"].toolbar,
};
exports.EVENTS = {
  blocksChanged: "typeblox.blocksChanged",
  styleChange: "typeblox.styleChanges",
  selectionChange: "typeblox.selectionChange",
};
