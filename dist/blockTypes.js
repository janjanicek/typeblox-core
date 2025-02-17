export const BLOCK_TYPES = {
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
export const blocksWithoutSelection = [BLOCK_TYPES.image];
export function addBlockType(blockName, blockKey) {
    BLOCK_TYPES[blockName] = blockKey;
}
export function removeBlockType(blockName) {
    delete BLOCK_TYPES[blockName];
}
export const AVAILABLE_BLOCKS = [
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
export function getAvailableBlocks() {
    return Object.values(BLOCKS_SETTINGS).map((block) => block.blockName);
}
export function getBlockSettings() {
    return BLOCKS_SETTINGS;
}
export const DEFAULT_BLOCK_TYPE = "text";
export const BLOCKS_SETTINGS = {
    headline1: {
        tag: "h1",
        visibleName: "Headline 1",
        blockName: BLOCK_TYPES.headline1,
        placeholder: "Heading 1",
        contentPattern: (content) => `${content}`,
        description: "Big section heading.",
        toolbar: "type | font | italic underline strikethrough | align | color | clearFormatting",
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
        contentPattern: (content) => `${content}`,
        description: "Medium section heading.",
        toolbar: "type | font | italic underline strikethrough | align | color | clearFormatting",
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
        contentPattern: (content) => `${content}`,
        description: "Small section heading.",
        toolbar: "type | font | italic underline strikethrough | align | color | clearFormatting",
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
        contentPattern: (content) => `${content}`,
        toolbar: "type | font | bold [italic,underline,strikethrough] | [align] | link | color bgColor | clearFormatting viewCode",
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
        contentPattern: (content) => `${content}`,
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
    code: {
        tag: "code",
        visibleName: "Code",
        blockName: BLOCK_TYPES.code,
        placeholder: "Write your code here...",
        contentPattern: (content) => `${content}`,
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
        contentPattern: (content) => {
            return `<li>${content}</li>`;
        },
        toolbar: "type | font | bold italic underline strikethrough | link | color bgColor | clearFormatting viewCode",
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
        contentPattern: (content) => `<li>${content}</li>`,
        toolbar: "type | font | bold italic underline strikethrough | link | color bgColor | clearFormatting viewCode",
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
        contentPattern: (content) => `${content}`,
        toolbar: "type | font | bold italic underline strikethrough | color bgColor | viewCode",
        icon: "Article",
        availableTypes: ["text", "code", "blockquote"],
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
        contentPattern: (content) => `${content}`,
        toolbar: "type | font | bold [italic,underline,strikethrough] | [align] | link | color bgColor | viewCode",
        icon: "Blockquote",
        availableTypes: ["text", "html", "code"],
        defaults: {
            classes: "",
            attributes: "",
            styles: "",
        },
    },
};
export function updateBlockSettings(blockType, updatedSettings) {
    if (BLOCKS_SETTINGS[blockType]) {
        BLOCKS_SETTINGS[blockType] = Object.assign(Object.assign({}, BLOCKS_SETTINGS[blockType]), updatedSettings);
    }
    else {
        addNewBlockSettings(blockType, updatedSettings);
    }
}
const DEFAULT_BLOCK_DATA = {
    tag: "div",
    visibleName: "New block",
    blockName: "default",
    description: "This is a sample block description",
    placeholder: "Write your content",
    contentPattern: (content) => `${content}`,
    toolbar: "type | font | bold [italic,underline,strikethrough] | [align] | link | color bgColor | clearFormatting viewCode",
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
function addNewBlockSettings(blockType, updatedSettings) {
    BLOCKS_SETTINGS[blockType] = Object.assign(Object.assign({}, DEFAULT_BLOCK_DATA), updatedSettings);
}
export function getToolbars() {
    return Object.entries(BLOCKS_SETTINGS).reduce((toolbars, [blockType, block]) => {
        toolbars[blockType] = block.toolbar;
        return toolbars;
    }, {});
}
