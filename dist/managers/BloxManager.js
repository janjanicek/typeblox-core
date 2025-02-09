import { EventEmitter } from "../classes/EventEmitter";
import { Blox } from "../classes/Blox";
import { BLOCKS_SETTINGS, BLOCK_TYPES, EVENTS } from "../constants";
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
        this.wasHistoryOperation = false;
        this.lastUpdatedContent = "";
    }
    updateChange(onChange) {
        this.onChange = onChange;
    }
    setDependencies(TypingManager, FormatManager, PasteManager, DOMManager, HistoryManager) {
        this.TypingManager = TypingManager;
        this.StyleManager = FormatManager;
        this.PasteManager = PasteManager;
        this.DOMManager = DOMManager;
        this.HistoryManager = HistoryManager;
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
        this.sendUpdateEvent();
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
    setBlox(newBlox, isHistoryOperation = false) {
        if (this.areBloxArraysEqual(this.blocks, newBlox)) {
            return;
        }
        this.blocks = newBlox;
        this.wasHistoryOperation = isHistoryOperation;
    }
    isAllSelected() {
        return this.blocks.every((b) => b.isSelected);
    }
    isAnySelected() {
        return this.blocks.some((b) => b.isSelected);
    }
    selectAllBlox(selectAll) {
        if (selectAll === this.isAllSelected())
            return;
        this.blocks.forEach((b) => (b.isSelected = selectAll));
        this.sendUpdateEvent();
    }
    isHistoryOperation() {
        return this.wasHistoryOperation;
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
    update({ onChange, blocks, calledFromEditor = false, forceUpdate = false, }) {
        var _a, _b, _c;
        const newBlocks = blocks !== null && blocks !== void 0 ? blocks : this.getBlox();
        const structureBeforeChange = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.blocksToHTML(this.blocks);
        const newStructure = (_b = this.DOMManager) === null || _b === void 0 ? void 0 : _b.blocksToHTML(newBlocks);
        this.setBlox(newBlocks);
        if (!newStructure)
            return;
        if (newStructure === this.lastUpdatedContent && !forceUpdate) {
            console.log("Typeblox: Update skipped structures are the same");
            return;
        }
        this.lastUpdatedContent = newStructure;
        onChange(newStructure);
        if (!this.wasHistoryOperation) {
            if (structureBeforeChange) {
                (_c = this.HistoryManager) === null || _c === void 0 ? void 0 : _c.saveState(structureBeforeChange);
            }
        }
        this.wasHistoryOperation = false;
        if (!calledFromEditor) {
            this.sendUpdateEvent();
        }
    }
    createBlox({ id, type = BLOCK_TYPES.text, content = "", style = "", classes = "", attributes = "", }) {
        if (!this.areDependenciesSet())
            return null;
        const generateId = id || Date.now().toString();
        const blockSettings = BLOCKS_SETTINGS[type];
        const updatedContent = content.trim() === "/" ? "" : content;
        const newBlockContent = updatedContent.trim() === ""
            ? blockSettings.contentPattern(updatedContent)
            : updatedContent;
        const block = new Blox({
            id: generateId,
            type,
            content: newBlockContent,
            onUpdate: this.onChange,
            TypingManager: this.TypingManager,
            StyleManager: this.StyleManager,
            PasteManager: this.PasteManager,
            DOMManager: this.DOMManager,
            HistoryManager: this.HistoryManager,
            style,
            classes,
            attributes,
        });
        block === null || block === void 0 ? void 0 : block.on(EVENTS.styleChange, () => {
            var _a;
            (_a = this.StyleManager) === null || _a === void 0 ? void 0 : _a.updateCurrentStyles(block);
        });
        block === null || block === void 0 ? void 0 : block.on(EVENTS.blocksChanged, () => {
            this.update({ onChange: this.onChange, forceUpdate: true });
        });
        return block;
    }
    removeById(blockId) {
        var _a;
        const index = this.blocks.findIndex((block) => block.id === blockId);
        if (index === -1) {
            return false;
        }
        // Remove the block from the array
        this.blocks.splice(index, 1);
        (_a = this.HistoryManager) === null || _a === void 0 ? void 0 : _a.saveState();
        // Emit the blocksChanged event
        this.sendUpdateEvent();
        return true;
    }
    moveBlock(blockId, newIndex) {
        const currentIndex = this.blocks.findIndex((block) => block.id === blockId);
        // Prevent invalid moves
        if (currentIndex === -1 ||
            newIndex < 0 ||
            newIndex >= this.blocks.length ||
            currentIndex === newIndex) {
            return false;
        }
        // Remove block from current position
        const [movedBlock] = this.blocks.splice(currentIndex, 1);
        // Insert block at the new index
        this.blocks.splice(newIndex, 0, movedBlock);
        this.sendUpdateEvent();
        return true;
    }
    moveBlockUp(blockId) {
        const index = this.blocks.findIndex((block) => block.id === blockId);
        if (index <= 0) {
            return false;
        }
        [this.blocks[index - 1], this.blocks[index]] = [
            this.blocks[index],
            this.blocks[index - 1],
        ];
        this.sendUpdateEvent();
        return true;
    }
    moveBlockDown(blockId) {
        const index = this.blocks.findIndex((block) => block.id === blockId);
        if (index === -1 || index >= this.blocks.length - 1) {
            return false;
        }
        [this.blocks[index], this.blocks[index + 1]] = [
            this.blocks[index + 1],
            this.blocks[index],
        ];
        this.sendUpdateEvent();
        return true;
    }
    split(blockId) {
        var _a;
        const blockElement = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElementById(blockId);
        const blox = this.getBlockById(blockId);
        if (!blockElement || !blox || !(blockElement instanceof HTMLElement))
            return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return;
        const range = selection.getRangeAt(0);
        const splitPoint = document.createElement("split-point");
        range.insertNode(splitPoint);
        const splitPointElement = blockElement.querySelector("split-point");
        if (!splitPointElement)
            return;
        const beforeRange = document.createRange();
        beforeRange.setStart(blockElement, 0);
        beforeRange.setEndBefore(splitPointElement);
        const beforeContent = beforeRange.cloneContents();
        const beforeCaretContainer = document.createElement("div");
        beforeCaretContainer.appendChild(beforeContent);
        const beforeCaret = beforeCaretContainer.innerHTML.trim();
        const afterRange = document.createRange();
        afterRange.setStartAfter(splitPointElement);
        afterRange.setEnd(blockElement, blockElement.childNodes.length);
        const afterContent = afterRange.cloneContents();
        const afterCaretContainer = document.createElement("div");
        afterCaretContainer.appendChild(afterContent);
        const afterCaret = afterCaretContainer.innerHTML.trim();
        splitPoint.remove();
        if (!beforeCaret || !afterCaret) {
            console.warn("Split aborted: No content before or after the caret.");
            return;
        }
        const bloxType = blox.type || BLOCK_TYPES.text;
        blockElement.innerHTML = beforeCaret;
        blox.setContent(beforeCaret);
        const newBlockId = this.addBlockAfter(blockId, bloxType, afterCaret);
        if (!newBlockId) {
            console.error("Failed to create a new block after splitting");
            return;
        }
        setTimeout(() => {
            var _a;
            (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.focusBlock(newBlockId, false);
        }, 100);
    }
    getPreviousBlock(blockId) {
        const blockIndex = this.blocks.findIndex((block) => block.id === blockId);
        if (blockIndex <= 0)
            return null;
        return this.blocks[blockIndex - 1];
    }
    getNextBlock(blockId) {
        const blockIndex = this.blocks.findIndex((block) => block.id === blockId);
        if (blockIndex >= this.blocks.length)
            return null;
        return this.blocks[blockIndex + 1];
    }
    canBeMerged(currentBlock, previousBlock) {
        return (previousBlock.type === currentBlock.type ||
            BLOCKS_SETTINGS[previousBlock.type].availableTypes.includes(currentBlock.type));
    }
    merge(blockId) {
        var _a, _b, _c;
        const blockIndex = this.blocks.findIndex((block) => block.id === blockId);
        if (blockIndex <= 0)
            return; // No previous block to merge with
        const currentBlock = this.blocks[blockIndex];
        const previousBlock = this.blocks[blockIndex - 1];
        if (!this.canBeMerged(currentBlock, previousBlock))
            return;
        const previousBlockElement = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElementById(previousBlock.id);
        const currentBlockElement = (_b = this.DOMManager) === null || _b === void 0 ? void 0 : _b.getBlockElementById(currentBlock.id);
        if (!previousBlockElement || !currentBlockElement)
            return;
        const markerId = `merge-marker-${Date.now()}`;
        const marker = document.createElement("span");
        marker.id = markerId;
        marker.style.opacity = "0"; // Make it invisible
        marker.style.position = "absolute"; // Prevent affecting layout
        marker.textContent = "\u200B"; // Zero-width space to ensure it's focusable
        previousBlockElement.appendChild(marker);
        previousBlockElement.innerHTML += currentBlock.content;
        this.blocks.splice(blockIndex, 1);
        const updatedPreviousBlockElement = (_c = this.DOMManager) === null || _c === void 0 ? void 0 : _c.getBlockElementById(previousBlock.id);
        const markerElement = updatedPreviousBlockElement === null || updatedPreviousBlockElement === void 0 ? void 0 : updatedPreviousBlockElement.querySelector(`#${markerId}`);
        if (markerElement) {
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStartAfter(markerElement);
            range.collapse(true);
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
            setTimeout(() => markerElement.remove(), 50);
        }
        this.sendUpdateEvent();
    }
    sendUpdateEvent() {
        this.emit(EVENTS.blocksChanged, [...this.blocks]);
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
