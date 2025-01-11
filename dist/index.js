import { BLOCKS_SETTINGS, CLASSES, EVENTS } from "./constants";
import { EventEmitter } from "events";
import { Blox } from "./classes/Blox";
import { FormatManager } from "./managers/FormatManager";
import { registerListeners, removeListeners } from "./utils/listeners";
import { HistoryManager } from "./managers/HistoryManager";
import { TypingManager } from "./managers/TypingManager";
import { DOMManager } from "./managers/DOMManager";
import { PasteManager } from "./managers/PasteManager";
class Typeblox extends EventEmitter {
    isSameSelection(newStart, newEnd) {
        const isSame = this.currentSelection.start === newStart &&
            this.currentSelection.end === newEnd;
        return isSame;
    }
    constructor() {
        super();
        this.blocks = [];
        this.currentStyles = {
            isBold: false,
            isItalic: false,
            isUnderline: false,
            isStrikeout: false,
            color: "#000000",
            backgroundColor: "#ffffff",
            fontFamily: "arial",
            isH1: false,
            isH2: false,
            isH3: false,
            isParagraph: false,
            isCode: false,
        };
        this.onChange = (updatedHTMLString) => {
            sessionStorage.setItem("tempEditorContent", updatedHTMLString);
        };
        this.currentSelection = { start: 0, end: 0 };
        // Private methods
        this.parseHTMLToBlocks = (htmlString) => {
            // Parse the HTML string into a DOM Document
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, "text/html");
            // Generate a unique ID generator
            let idCounter = 1;
            const generateId = () => (idCounter++).toString();
            // Map each top-level element to the desired structure
            const structure = Array.from(doc.body.children).map((element) => {
                var _a, _b;
                const tagName = element.tagName.toLowerCase();
                let block = new Blox({
                    id: generateId(),
                    type: "text", // Default block type
                    content: ((_a = element.innerHTML) === null || _a === void 0 ? void 0 : _a.trim()) || "",
                    onUpdate: this.onChange,
                    TypingManager: this.TypingManager,
                    FormatManager: this.FormatManager,
                    PasteManager: this.PasteManager,
                });
                // Find the corresponding block type in BLOCKS_SETTINGS
                const blockSetting = Object.values(BLOCKS_SETTINGS).find((setting) => setting.tag === tagName);
                if (blockSetting) {
                    block = new Blox({
                        id: generateId(),
                        type: blockSetting.blockName,
                        content: tagName === "img" // Special case for images
                            ? element.getAttribute("src") || ""
                            : (_b = element.innerHTML) === null || _b === void 0 ? void 0 : _b.trim(),
                        onUpdate: this.onChange,
                        TypingManager: this.TypingManager,
                        FormatManager: this.FormatManager,
                        PasteManager: this.PasteManager,
                    });
                }
                block.on(EVENTS.styleChange, () => {
                    this.updateCurrentStyles(block);
                });
                block.on(EVENTS.blocksChanged, () => {
                    this.update(this.onChange);
                });
                return block;
            });
            return structure;
        };
        this.detectSelection = () => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const start = range.startOffset;
                const end = range.endOffset;
                // Get the parent element of the range
                const parentElement = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
                    ? range.commonAncestorContainer
                    : range.commonAncestorContainer.parentElement;
                const editorElement = parentElement === null || parentElement === void 0 ? void 0 : parentElement.closest("[data-typeblox-editor]");
                if (editorElement && !this.isSameSelection(start, end)) {
                    this.currentSelection = { start, end };
                    this.currentStyles = this.getSelectionStyle();
                    this.emit(EVENTS.selectionChange, this.currentStyles);
                }
            }
        };
        this.getCurrentDom = () => {
            return this.DOMManager.blocksToHTML(this.blocks);
        };
        this.saveHistory = () => {
            this.HistoryManager.saveState(this.getCurrentDom());
        };
        this.updateEditorContent = (newContent) => {
            this.blocks = this.parseHTMLToBlocks(newContent);
            this.emit(EVENTS.blocksChanged, this.blocks);
        };
        // Undo
        this.handleUndo = () => {
            var _a;
            const previousState = (_a = this.HistoryManager) === null || _a === void 0 ? void 0 : _a.undo(this.getCurrentDom());
            if (previousState) {
                this.updateEditorContent(previousState);
            }
        };
        // Redo
        this.handleRedo = () => {
            var _a;
            const nextState = (_a = this.HistoryManager) === null || _a === void 0 ? void 0 : _a.redo(this.getCurrentDom());
            if (nextState) {
                this.updateEditorContent(nextState);
            }
        };
        this.DOMManager = new DOMManager();
        this.PasteManager = new PasteManager(this.DOMManager);
        this.HistoryManager = new HistoryManager(25);
        this.TypingManager = new TypingManager();
        this.FormatManager = new FormatManager(this.TypingManager, this.DOMManager);
        this.currentStyles = this.getSelectionStyle();
        registerListeners(this.detectSelection);
    }
    updateCurrentStyles(block) {
        const detectedStyles = this.getSelectionStyle();
        // Update `currentStyles` with the detected styles
        this.currentStyles = Object.assign(Object.assign({}, this.currentStyles), detectedStyles);
        // Optionally, emit a high-level styleChange event for external listeners
        this.emit(EVENTS.styleChange, this.currentStyles);
    }
    // Public methods
    init(options) {
        const { HTMLString, onUpdate } = options;
        if (HTMLString)
            this.blocks = this.parseHTMLToBlocks(HTMLString);
        if (onUpdate)
            this.onChange = onUpdate;
    }
    destroy() {
        this.blocks = [];
        this.onChange = () => { };
        removeListeners(this.detectSelection);
    }
    selection() {
        return this.TypingManager;
    }
    format() {
        return this.FormatManager;
    }
    DOM() {
        return this.DOMManager;
    }
    paste() {
        return this.PasteManager;
    }
    update(onChange, providedBlocks, calledFromEditor) {
        const newBlocks = providedBlocks !== null && providedBlocks !== void 0 ? providedBlocks : this.blocks;
        this.blocks = newBlocks;
        onChange(this.DOMManager.blocksToHTML(newBlocks));
        this.saveHistory();
        if (!calledFromEditor)
            this.emit(EVENTS.blocksChanged, this.blocks);
    }
    getBlockById(id) {
        var _a;
        return (_a = this.blocks) === null || _a === void 0 ? void 0 : _a.find((block) => block.id === id);
    }
    getBlockElementById(id) {
        if (!id)
            return null;
        return this.DOMManager.getBlockElementById(id);
    }
    getBlocks() {
        return this.blocks;
    }
    getSelectionStyle() {
        return this.format().getStyle();
    }
    getSelectionElement() {
        const blockElement = this.DOMManager.getBlockElement();
        if (blockElement) {
            return blockElement.querySelector(`.${CLASSES.selected}`);
        }
        return null;
    }
    unselect(element, callBack) {
        let currentSelection = element;
        if (!currentSelection)
            currentSelection = this.getSelectionElement();
        try {
            this.TypingManager.removeSelection(currentSelection);
        }
        catch (error) {
            console.error("Error removing selection:", error);
            return;
        }
        this.handleSelectionChange();
        this.executeCallback(callBack);
    }
    select(range, callBack) {
        try {
            this.TypingManager.createSelectedElement(range);
        }
        catch (error) {
            console.error("Error creating selected element:", error);
            return;
        }
        this.handleSelectionChange();
        this.executeCallback(callBack);
    }
    executeCallback(callBack) {
        if (callBack && typeof callBack === "function") {
            try {
                callBack();
            }
            catch (error) {
                console.error("Error executing callback:", error);
            }
        }
    }
    handleSelectionChange() {
        this.emit(EVENTS.selectionChange, this.currentStyles);
    }
    isStyle(style) {
        switch (style) {
            case "bold": {
                return this.currentStyles.isBold;
            }
            case "italic": {
                return this.currentStyles.isItalic;
            }
            case "underline": {
                return this.currentStyles.isUnderline;
            }
            case "strikethrough": {
                return this.currentStyles.isStrikeout;
            }
            default:
                break;
        }
        return false;
    }
    getStyle(style) {
        const styles = this.getSelectionStyle();
        return styles[style];
    }
    getCurrentBlock() {
        var _a;
        const currentBlockElement = this.DOMManager.getBlockElement();
        if (currentBlockElement) {
            const blockId = currentBlockElement.dataset.typebloxId;
            if (blockId) {
                return (_a = this.getBlockById(blockId)) !== null && _a !== void 0 ? _a : null;
            }
        }
        return null;
    }
    getSelectedBlock() { }
}
export default Typeblox;
