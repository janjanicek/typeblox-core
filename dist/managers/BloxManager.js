import { EventEmitter } from "../classes/EventEmitter";
import { Blox } from "../classes/Blox";
import { EVENTS } from "../constants";
import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../blockTypes";
export class BloxManager extends EventEmitter {
    constructor(onChange) {
        super();
        this.blocks = [];
        this.TypingManager = null;
        this.StyleManager = null;
        this.DOMManager = null;
        this.PasteManager = null;
        this.HistoryManager = null;
        this.globalIdCounter = 1000;
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
    findBlockContext(id, list = this.blocks, parentList = null) {
        for (let i = 0; i < list.length; i++) {
            const blk = list[i];
            if (blk.id === id) {
                return { list, index: i, parentList };
            }
            // Search within columns if present
            if (blk.columns && blk.columns.length) {
                for (const column of blk.columns) {
                    const colList = column.blox;
                    const found = this.findBlockContext(id, colList, list);
                    if (found.index !== -1) {
                        return found;
                    }
                }
            }
        }
        return { list: this.blocks, index: -1, parentList: null };
    }
    addBlockAfter(blockId, type, content = "", select = true) {
        const ctx = this.findBlockContext(blockId);
        if (ctx.index === -1) {
            console.warn(`Block with ID ${blockId} not found`);
            return null;
        }
        const list = ctx.list;
        const newId = Date.now().toString();
        const newBlock = this.createBlox({ id: newId, type, content });
        if (!newBlock)
            return null;
        list.splice(ctx.index + 1, 0, newBlock);
        this.sendUpdateEvent();
        if (select)
            setTimeout(() => { var _a; return (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.focusBlock(newId, true); }, 100);
        return newId;
    }
    findBlockIndex(blockId) {
        return this.blocks.findIndex((block) => block.id === blockId);
    }
    addBlockBefore(blockId, type, content = "", select = true) {
        const ctx = this.findBlockContext(blockId);
        if (ctx.index === -1) {
            console.warn(`Block with ID ${blockId} not found`);
            return null;
        }
        const list = ctx.list;
        const newId = Date.now().toString();
        const newBlock = this.createBlox({ id: newId, type, content });
        if (!newBlock)
            return null;
        list.splice(ctx.index, 0, newBlock);
        this.sendUpdateEvent();
        if (select)
            setTimeout(() => { var _a; return (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.focusBlock(newId, true); }, 100);
        return newId;
    }
    getBlockById(id) {
        if (!id)
            return undefined;
        const { list, index } = this.findBlockContext(id);
        return index !== -1 ? list[index] : undefined;
    }
    getBlockIndex(id) {
        if (!id)
            return -1;
        const { index } = this.findBlockContext(id);
        return index;
    }
    getParentBlockId(id) {
        const topLevelParent = this.findBlockContext(id);
        if (topLevelParent.parentList === null) {
            return null; // This block is a top-level block, so it has no parent
        }
        const { parentList } = topLevelParent;
        if (parentList.length === 1) {
            return parentList[0].id; // This block is the only child of its parent
        }
        return null;
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
        if (blocks)
            blocks.forEach((block) => this.registerEvents(block));
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
        const generateId = id !== null && id !== void 0 ? id : `${Date.now()}-${this.globalIdCounter++}`;
        const blockSettings = BLOCKS_SETTINGS[type];
        const newContent = content.trim() === "/" ? "" : content;
        const finalContent = newContent.trim() === ""
            ? blockSettings.contentPattern(newContent)
            : newContent;
        const block = new Blox({
            id: generateId,
            type,
            content: finalContent,
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
        this.registerEvents(block);
        if (type === BLOCK_TYPES.columns) {
            block.columns = [
                { blox: [this.createBlox({ type: BLOCK_TYPES.text, content: "" })] },
                { blox: [this.createBlox({ type: BLOCK_TYPES.text, content: "" })] },
            ];
        }
        return block;
    }
    registerEvents(block) {
        if (!block._listeners) {
            block._listeners = {};
        }
        // If listeners exist, remove them first
        if (block._listeners[EVENTS.styleChange]) {
            block.off(EVENTS.styleChange, block._listeners[EVENTS.styleChange]);
        }
        if (block._listeners[EVENTS.blocksChanged]) {
            block.off(EVENTS.blocksChanged, block._listeners[EVENTS.blocksChanged]);
        }
        // Define handlers and store them
        block._listeners[EVENTS.styleChange] = () => {
            var _a;
            (_a = this.StyleManager) === null || _a === void 0 ? void 0 : _a.updateCurrentStyles(block);
        };
        block._listeners[EVENTS.blocksChanged] = () => {
            this.update({ onChange: this.onChange, forceUpdate: true });
        };
        // Register events using stored handlers
        block.on(EVENTS.styleChange, block._listeners[EVENTS.styleChange]);
        block.on(EVENTS.blocksChanged, block._listeners[EVENTS.blocksChanged]);
    }
    removeById(blockId) {
        var _a, _b;
        const { list, index, parentList } = this.findBlockContext(blockId);
        if (index === -1)
            return false;
        // remove it
        list.splice(index, 1);
        (_a = this.HistoryManager) === null || _a === void 0 ? void 0 : _a.saveState();
        // if we just emptied a columns wrapper, you might want to delete it too:
        if (parentList && list.length === 0) {
            const { list: grandList, index: parentIdx } = this.findBlockContext((_b = parentList[index - 1]) === null || _b === void 0 ? void 0 : _b.id);
            grandList.splice(parentIdx, 1);
        }
        // if top-level went empty, add a blank
        this.fillContextWithEmptyBlock(list);
        this.sendUpdateEvent();
        return true;
    }
    fillContextWithEmptyBlock(ctx) {
        if (ctx.length === 0) {
            const newBlock = this.createBlox({ type: BLOCK_TYPES.text });
            if (newBlock)
                ctx.push(newBlock);
        }
    }
    moveBlock(blockId, newIndex, overElementId) {
        // source
        const { list: fromList, index: fromIdx } = this.findBlockContext(blockId);
        if (fromIdx === -1)
            return false;
        // remove it
        const [moved] = fromList.splice(fromIdx, 1);
        // destination list: either the same list, or a nested column
        const toList = overElementId
            ? this.findBlockContext(overElementId).list
            : fromList;
        // clamp newIndex
        const destIdx = Math.min(Math.max(newIndex, 0), toList.length);
        toList.splice(destIdx, 0, moved);
        this.sendUpdateEvent();
        this.fillContextWithEmptyBlock(fromList);
        return true;
    }
    moveBlockUp(blockId) {
        const { index } = this.findBlockContext(blockId);
        if (index <= 0)
            return false;
        return this.moveBlock(blockId, index - 1);
    }
    moveBlockDown(blockId) {
        const { list, index } = this.findBlockContext(blockId);
        if (index === -1 || index >= list.length - 1)
            return false;
        return this.moveBlock(blockId, index + 1);
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
        const { list, index } = this.findBlockContext(blockId);
        return index > 0 ? list[index - 1] : null;
    }
    getNextBlock(blockId) {
        const { list, index } = this.findBlockContext(blockId);
        return index !== -1 && index < list.length - 1 ? list[index + 1] : null;
    }
    canBeMerged(currentBlock, previousBlock) {
        return (previousBlock.type === currentBlock.type ||
            BLOCKS_SETTINGS[previousBlock.type].availableTypes.includes(currentBlock.type));
    }
    merge(blockId) {
        var _a, _b, _c;
        // locate the block within its list (top-level or column)
        const ctx = this.findBlockContext(blockId);
        const { list, index } = ctx;
        // nothing to merge if at start of list
        if (index <= 0)
            return;
        const currentBlock = list[index];
        const previousBlock = list[index - 1];
        if (!this.canBeMerged(currentBlock, previousBlock))
            return;
        const prevEl = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElementById(previousBlock.id);
        const currEl = (_b = this.DOMManager) === null || _b === void 0 ? void 0 : _b.getBlockElementById(currentBlock.id);
        if (!prevEl || !currEl)
            return;
        const markerId = `merge-marker-${Date.now()}`;
        const marker = document.createElement("span");
        marker.id = markerId;
        marker.style.opacity = "0";
        marker.style.position = "absolute";
        marker.textContent = "\u200B";
        prevEl.appendChild(marker);
        prevEl.innerHTML += currentBlock.content;
        list.splice(index, 1);
        const updatedPrevEl = (_c = this.DOMManager) === null || _c === void 0 ? void 0 : _c.getBlockElementById(previousBlock.id);
        const markerEl = updatedPrevEl === null || updatedPrevEl === void 0 ? void 0 : updatedPrevEl.querySelector(`#${markerId}`);
        if (markerEl) {
            const range = document.createRange();
            const sel = window.getSelection();
            range.setStartAfter(markerEl);
            range.collapse(true);
            sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
            sel === null || sel === void 0 ? void 0 : sel.addRange(range);
            setTimeout(() => markerEl.remove(), 50);
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
