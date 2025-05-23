import { EVENTS } from "./constants";
import { updateBlockSettings } from "./blockTypes";
import { EventEmitter } from "events";
import { StyleManager } from "./managers/StyleManager";
import { registerListeners, removeListeners } from "./utils/listeners";
import { HistoryManager } from "./managers/HistoryManager";
import { TypingManager } from "./managers/TypingManager";
import { DOMManager } from "./managers/DOMManager";
import { BloxManager } from "./managers/BloxManager";
import { PasteManager } from "./managers/PasteManager";
import { ExtensionsManager } from "./managers/ExtensionsManager";
import { ShortcutsManager } from "./managers/ShortcutsManager";
import { LinkManager } from "./managers/LinkManager";
import { EditorManager } from "./managers/EditorManager";
class Typeblox extends EventEmitter {
    isSameSelection(newStart, newEnd) {
        const isSame = this.currentSelection.start === newStart &&
            this.currentSelection.end === newEnd;
        return isSame;
    }
    constructor() {
        super();
        this.onChange = (updatedHTMLString) => {
            sessionStorage.setItem("tempEditorContent", updatedHTMLString);
        };
        this.onImageUpload = (blobInfo, success, failure) => {
            try {
                const blob = blobInfo.blob(); // Get the blob object from blobInfo
                const blobName = blobInfo.filename(); // Assume blobInfo has a filename method
                const blobURL = URL.createObjectURL(blob); // Create a temporary URL for the blob
                // Simulate a success callback with the URL
                success(blobURL);
            }
            catch (error) {
                // If there's an error, call the failure callback with the error message
                failure("Failed to upload the image");
            }
        };
        this.currentSelection = { start: 0, end: 0 };
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
                    this.emit(EVENTS.selectionChange, this.style().getStyle());
                }
            }
        };
        this.updateEditorContent = (newContent, isUndo) => {
            const isHistoryOperation = isUndo !== undefined;
            const recoveredStructure = newContent
                ? this.elements().parseHTMLToBlocks(newContent)
                : this.blox().getBlox();
            this.blox().setBlox(recoveredStructure, isHistoryOperation);
            this.editor().refresh();
            this.emit(EVENTS.blocksChanged, recoveredStructure);
        };
        this.HistoryManager = new HistoryManager(25);
        this.TypingManager = new TypingManager();
        this.PasteManager = new PasteManager(); // No dependencies initially
        this.StyleManager = new StyleManager(); // No dependencies initially
        this.BloxManager = new BloxManager(this.onChange); // No dependencies initially
        this.DOMManager = new DOMManager(); // No dependencies initially
        this.ExtensionsManager = new ExtensionsManager();
        this.ShortcutsManager = new ShortcutsManager();
        this.LinkManager = new LinkManager();
        this.EditorManager = new EditorManager();
        this.PasteManager.setDependencies(this.DOMManager, this.BloxManager);
        this.StyleManager.setDependencies(this.DOMManager, this.TypingManager, this.LinkManager);
        this.BloxManager.setDependencies(this.TypingManager, this.StyleManager, this.PasteManager, this.DOMManager, this.HistoryManager);
        this.DOMManager.setDependencies(this.BloxManager, this.TypingManager, this.EditorManager, this.LinkManager);
        this.TypingManager.setDependencies(this.DOMManager);
        this.HistoryManager.setDependencies(this.DOMManager);
        this.EditorManager.setDependencies(this.BloxManager, this.TypingManager);
        this.ShortcutsManager.setDependencies(this.BloxManager, this.DOMManager, this.TypingManager, this.HistoryManager);
        this.BloxManager.on(EVENTS.blocksChanged, (blocks) => {
            this.emit(EVENTS.blocksChanged, blocks);
            this.editor().refresh();
        });
        this.StyleManager.on(EVENTS.styleChange, (block) => {
            this.emit(EVENTS.styleChange, block);
            this.editor().refresh();
        });
        this.HistoryManager.on(EVENTS.historyChange, (newState, isUndo) => {
            if (newState) {
                this.updateEditorContent(newState, isUndo);
            }
        });
        this.TypingManager.on(EVENTS.selectionChange, () => {
            this.handleSelectionChange();
        });
        registerListeners(this.detectSelection);
    }
    // Public methods
    init(options) {
        var _a, _b;
        const { HTMLString, onUpdate, onImageUpload, extensions, blocks, editorContainer, } = options;
        window.typebloxEditor = this;
        if (HTMLString) {
            this.blox().setBlox(this.elements().parseHTMLToBlocks(HTMLString));
        }
        else {
            const newBlock = (_a = this.BloxManager) === null || _a === void 0 ? void 0 : _a.createBlox({});
            if (newBlock)
                this.blox().setBlox([newBlock]);
        }
        if (onUpdate) {
            this.onChange = onUpdate;
            (_b = this.BloxManager) === null || _b === void 0 ? void 0 : _b.updateChange(onUpdate);
        }
        if (onImageUpload)
            this.onImageUpload = this.onImageUpload;
        if (extensions)
            this.registerAllExtensions(extensions);
        if (blocks)
            this.updateBlockSettings(blocks);
        if (editorContainer) {
            this.editor().createEditorContent(editorContainer);
        }
    }
    updateBlockSettings(blocks) {
        console.warn("updateBlockSettings");
        Object.entries(blocks).forEach(([blockType, updatedSettings]) => {
            updateBlockSettings(blockType, updatedSettings);
        });
    }
    registerAllExtensions(extensions) {
        extensions.forEach((extension) => {
            this.extensions().registerExtension(extension);
        });
    }
    destroy() {
        this.blox().setBlox([]);
        this.ShortcutsManager.unregisterShortcuts();
        this.onChange = () => { };
        removeListeners(this.detectSelection);
        this.editor().clearEditor();
    }
    selection() {
        return this.TypingManager;
    }
    style() {
        return this.StyleManager;
    }
    blox() {
        return this.BloxManager;
    }
    extensions() {
        return this.ExtensionsManager;
    }
    elements() {
        return this.DOMManager;
    }
    link() {
        return this.LinkManager;
    }
    paste() {
        return this.PasteManager;
    }
    history() {
        return this.HistoryManager;
    }
    editor() {
        return this.EditorManager;
    }
    getBlockById(id) {
        return this.blox().getBlockById(id);
    }
    getBlockElementById(id) {
        if (!id)
            return null;
        return this.DOMManager.getBlockElementById(id);
    }
    getSelectionStyle() {
        return this.style().getStyle();
    }
    unselect(element, callBack) {
        let currentSelection = element;
        if (!currentSelection)
            currentSelection = this.selection().getSelectedElement();
        try {
            this.TypingManager.removeSelection();
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
            this.TypingManager.saveSelection();
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
        this.emit(EVENTS.selectionChange, this.blox().getCurrentBlock());
    }
    isStyle(style) {
        switch (style) {
            case "bold": {
                return this.style().getStyle().isBold;
            }
            case "italic": {
                return this.style().getStyle().isItalic;
            }
            case "underline": {
                return this.style().getStyle().isUnderline;
            }
            case "strikethrough": {
                return this.style().getStyle().isStrikeout;
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
}
export default Typeblox;
