import { BLOCKS_SETTINGS } from "../blockTypes";
export class EditorManager {
    constructor(initialBloxManager, initialTypingManager, editorContainer) {
        this.BloxManager = null;
        this.TypingManager = null;
        this.editorContainer = undefined;
        this.clearEditor = () => {
            if (!this.editorContainer)
                return;
            const editorElement = document.querySelector(this.editorContainer);
            if (editorElement)
                editorElement.innerHTML = "";
        };
        this.refresh = () => {
            if (this.editorContainer) {
                this.clearEditor();
                this.createEditorContent(this.editorContainer);
            }
        };
        if (initialBloxManager) {
            this.BloxManager = initialBloxManager;
        }
        if (initialTypingManager) {
            this.TypingManager = initialTypingManager;
        }
        this.editorContainer = editorContainer;
    }
    setDependencies(BloxManager, TypingManager) {
        this.BloxManager = BloxManager;
        this.TypingManager = TypingManager;
    }
    createEditorContent(editorContainer) {
        var _a;
        if (!editorContainer)
            return;
        this.editorContainer = editorContainer;
        const editorElement = this.editorContainer
            ? document.querySelector(this.editorContainer)
            : null;
        if (!editorElement)
            return;
        const blocks = (_a = this.BloxManager) === null || _a === void 0 ? void 0 : _a.getBlox();
        if (blocks)
            blocks.forEach((block) => {
                const blockSettings = BLOCKS_SETTINGS[block.type];
                if (blockSettings) {
                    const blockElement = document.createElement(blockSettings.tag);
                    blockElement.dataset.typebloxId = block.id;
                    blockElement.dataset.typebloxEditor = "block";
                    blockElement.setAttribute("placeholder", BLOCKS_SETTINGS[block.type].placeholder);
                    blockElement.setAttribute("contenteditable", "true");
                    blockElement.setAttribute("class", block.classes);
                    blockElement.setAttribute("style", block.styles);
                    const attributes = block.getAttributes();
                    Object.entries(attributes).forEach(([key, value]) => {
                        blockElement.setAttribute(key, value.toString());
                    });
                    blockElement.innerHTML = block.content;
                    editorElement.append(blockElement);
                }
            });
    }
}
