import { EventEmitter } from "../classes/EventEmitter";
import { Blox } from "../classes/Blox";
import { BLOCK_TYPES, EVENTS } from "../constants";
export class BloxManager extends EventEmitter {
    constructor(onChange) {
        super();
        this.blocks = [];
        this.TypingManager = null;
        this.StyleManager = null;
        this.DOMManager = null;
        this.PasteManager = null;
        this.HistoryManager = null;
        this.areDependenciesSet = () => this.TypingManager &&
            this.StyleManager &&
            this.PasteManager &&
            this.DOMManager &&
            this.onChange;
        this.onChange = onChange;
        this.blocks = [];
        this.wasCreatedByUndo = false;
    }
    setDependencies(TypingManager, FormatManager, PasteManager, DOMManager, HistoryManager, onChange) {
        this.TypingManager = TypingManager;
        this.StyleManager = FormatManager;
        this.PasteManager = PasteManager;
        this.DOMManager = DOMManager;
        this.HistoryManager = HistoryManager;
        this.onChange = onChange;
    }
    addBlockAfter(blockId, type, content = "", select = true) {
        const index = this.blocks.findIndex((block) => block.id === blockId);
        if (index === -1) {
            console.warn(`Block with ID ${blockId} not found`);
            return null;
        }
        const newBlockId = Date.now().toString();
        const newBlock = this.createBlox({
            id: newBlockId,
            type,
            content,
        });
        if (!newBlock) {
            console.error("Failed to create a new block. Dependencies may not be set.");
            return null;
        }
        // Insert the new block after the found index
        this.blocks.splice(index + 1, 0, newBlock);
        this.emit(EVENTS.blocksChanged, [...this.blocks]);
        // Optionally focus the new block
        if (select) {
            setTimeout(() => { var _a; return (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.focusBlock(newBlockId, true); }, 100);
        }
        return newBlockId;
    }
    addBlockBefore(blockId, type, content = "", select = true) {
        const index = this.blocks.findIndex((block) => block.id === blockId);
        if (index === -1) {
            console.warn(`Block with ID ${blockId} not found`);
            return null;
        }
        const newBlockId = Date.now().toString();
        const newBlock = this.createBlox({
            id: newBlockId,
            type,
            content,
        });
        if (!newBlock) {
            console.error("Failed to create a new block. Dependencies may not be set.");
            return null;
        }
        // Insert the new block before the found index
        this.blocks.splice(index, 0, newBlock);
        this.emit(EVENTS.blocksChanged, [...this.blocks]);
        // Optionally focus the new block
        if (select) {
            setTimeout(() => { var _a; return (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.focusBlock(newBlockId, true); }, 100);
        }
        return newBlockId;
    }
    getBlockById(id) {
        var _a;
        return (_a = this.blocks) === null || _a === void 0 ? void 0 : _a.find((block) => block.id === id);
    }
    getBlox() {
        return this.blocks;
    }
    setBlox(newBlox, isUndo = false) {
        if (this.areBloxArraysEqual(this.blocks, newBlox)) {
            return;
        }
        this.blocks = newBlox;
        this.wasCreatedByUndo = isUndo;
    }
    isUndo() {
        return this.wasCreatedByUndo;
    }
    areBloxArraysEqual(array1, array2) {
        if (array1.length !== array2.length) {
            return false;
        }
        return array1.every((block, index) => {
            const otherBlock = array2[index];
            return (block.id === otherBlock.id &&
                block.type === otherBlock.type &&
                block.content === otherBlock.content);
        });
    }
    update(onChange, providedBlocks, calledFromEditor) {
        var _a, _b;
        const newBlocks = providedBlocks !== null && providedBlocks !== void 0 ? providedBlocks : this.getBlox();
        this.setBlox(newBlocks);
        const newStructure = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.blocksToHTML(newBlocks);
        if (!newStructure)
            return;
        onChange(newStructure);
        if (!this.wasCreatedByUndo) {
            (_b = this.HistoryManager) === null || _b === void 0 ? void 0 : _b.saveState(newStructure);
        }
        this.wasCreatedByUndo = false;
        if (!calledFromEditor)
            this.emit(EVENTS.blocksChanged, this.getBlox());
    }
    createBlox({ id, type = BLOCK_TYPES.text, content = "", style = "", classes = "", attributes = "", }) {
        if (!this.areDependenciesSet())
            return null;
        const generateId = id || Date.now().toString();
        const block = new Blox({
            id: generateId,
            type,
            content,
            onUpdate: this.onChange,
            TypingManager: this.TypingManager,
            StyleManager: this.StyleManager,
            PasteManager: this.PasteManager,
            style,
            classes,
            attributes,
        });
        block === null || block === void 0 ? void 0 : block.on(EVENTS.styleChange, () => {
            var _a;
            (_a = this.StyleManager) === null || _a === void 0 ? void 0 : _a.updateCurrentStyles(block);
        });
        block === null || block === void 0 ? void 0 : block.on(EVENTS.blocksChanged, () => {
            this.update(this.onChange);
        });
        return block;
    }
    removeById(blockId) {
        const index = this.blocks.findIndex((block) => block.id === blockId);
        if (index === -1) {
            return false;
        }
        // Remove the block from the array
        this.blocks.splice(index, 1);
        // Emit the blocksChanged event
        this.emit(EVENTS.blocksChanged, [...this.blocks]);
        return true;
    }
    moveBlockUp(blockId) {
        const index = this.blocks.findIndex((block) => block.id === blockId);
        if (index <= 0) {
            // Block is already at the top or not found
            return false;
        }
        // Swap the block with the one above it
        [this.blocks[index - 1], this.blocks[index]] = [
            this.blocks[index],
            this.blocks[index - 1],
        ];
        // Emit the updated blocks array
        this.emit(EVENTS.blocksChanged, [...this.blocks]);
        return true;
    }
    moveBlockDown(blockId) {
        const index = this.blocks.findIndex((block) => block.id === blockId);
        if (index === -1 || index >= this.blocks.length - 1) {
            // Block is already at the bottom or not found
            return false;
        }
        // Swap the block with the one below it
        [this.blocks[index], this.blocks[index + 1]] = [
            this.blocks[index + 1],
            this.blocks[index],
        ];
        // Emit the updated blocks array
        this.emit(EVENTS.blocksChanged, [...this.blocks]);
        return true;
    }
    split(blockId) {
        var _a;
        const blockElement = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElementById(blockId);
        const blox = this.getBlockById(blockId);
        if (!blockElement || !blox)
            return;
        // Get the current selection and caret position
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return;
        const range = selection.getRangeAt(0);
        const caretPosition = range.startOffset;
        // Extract the block's content
        const fullContent = blox.content || ""; // Use the content stored in the block
        const beforeCaret = fullContent.slice(0, caretPosition).trim(); // Trim whitespace
        const afterCaret = fullContent.slice(caretPosition).trim(); // Trim whitespace
        // Prevent splitting if the content before or after the caret is empty or contains only <br>
        if (!beforeCaret ||
            !afterCaret ||
            beforeCaret === "<br>" ||
            afterCaret === "<br>") {
            return;
        }
        const bloxType = blox.type || BLOCK_TYPES.text;
        // Update the current block with the content before the caret
        blox.setContent(beforeCaret);
        // Add a new block with the content after the caret
        const newBlockId = this.addBlockAfter(blockId, bloxType, afterCaret);
        if (!newBlockId)
            return;
        // Focus the new block after a short delay
        setTimeout(() => {
            var _a;
            (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.focusBlock(newBlockId, false);
        }, 100);
    }
    merge(blockId) {
        var _a;
        const blockIndex = this.blocks.findIndex((block) => block.id === blockId);
        if (blockIndex <= 0)
            return; // No previous block to merge with
        const currentBlock = this.blocks[blockIndex];
        const previousBlock = this.blocks[blockIndex - 1];
        // Merge content of the current block into the previous block
        previousBlock.content += currentBlock.content;
        // Remove the current block
        this.blocks.splice(blockIndex, 1);
        // Emit blocksChanged event to update the UI
        this.emit(EVENTS.blocksChanged, [...this.blocks]);
        (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.focusBlock(previousBlock.id, true);
    }
    getCurrentBlock() {
        var _a, _b;
        const currentBlockElement = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElement();
        if (currentBlockElement) {
            const blockId = currentBlockElement.dataset.typebloxId;
            if (blockId) {
                return (_b = this.getBlockById(blockId)) !== null && _b !== void 0 ? _b : null;
            }
        }
        return null;
    }
}
