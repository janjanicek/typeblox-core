import { isEmpty } from "../utils/elements";
import { blocksWithoutSelection, BLOCK_TYPES, DEFAULT_BLOCK_TYPE, } from "../blockTypes";
export class ShortcutsManager {
    constructor(initialBloxManager, initialDOMManager, initialTypingManager, initialHistoryManager) {
        this.DOMManager = null;
        this.BloxManager = null;
        this.TypingManager = null;
        this.HistoryManager = null;
        this.shortcutHandler = null;
        if (initialBloxManager) {
            this.BloxManager = initialBloxManager;
        }
        if (initialDOMManager) {
            this.DOMManager = initialDOMManager;
        }
        if (initialTypingManager) {
            this.TypingManager = initialTypingManager;
        }
        if (initialHistoryManager) {
            this.HistoryManager = initialHistoryManager;
        }
        this.registerShortcuts();
    }
    setDependencies(BloxManager, DOMManager, TypingManager, HistoryManager) {
        this.BloxManager = BloxManager;
        this.DOMManager = DOMManager;
        this.TypingManager = TypingManager;
        this.HistoryManager = HistoryManager;
    }
    registerShortcuts() {
        this.unregisterShortcuts(); // Ensure we don’t register multiple handlers
        this.shortcutHandler = (event) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16;
            let blockElement = null;
            const currentBlockFromEvent = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockFromEvent(event);
            const currentBlock = (_b = this.BloxManager) === null || _b === void 0 ? void 0 : _b.getCurrentBlock();
            const isBlockEvent = currentBlockFromEvent === currentBlock;
            const isBlockContext = isBlockEvent && currentBlock;
            if (currentBlock)
                blockElement = (_c = this.DOMManager) === null || _c === void 0 ? void 0 : _c.getBlockElementById(currentBlock.id);
            // Select all
            if ((event.metaKey || event.ctrlKey) && event.key === "a") {
                event.preventDefault();
                if (isBlockContext) {
                    // block context
                    if ((_d = this.BloxManager) === null || _d === void 0 ? void 0 : _d.isAnySelected()) {
                        (_e = this.BloxManager) === null || _e === void 0 ? void 0 : _e.selectAllBlox(true);
                    }
                    else {
                        if (!currentBlock.isSelected) {
                            event.stopPropagation();
                            currentBlock.setIsSelected(true);
                        }
                    }
                }
                else {
                    // editor content
                    event.preventDefault();
                    (_f = this.BloxManager) === null || _f === void 0 ? void 0 : _f.selectAllBlox(true);
                }
            }
            if (event.key === "Backspace") {
                if ((_g = this.BloxManager) === null || _g === void 0 ? void 0 : _g.isAllSelected()) {
                    event.preventDefault();
                    const newBlock = (_h = this.BloxManager) === null || _h === void 0 ? void 0 : _h.createBlox({});
                    if (newBlock) {
                        (_j = this.BloxManager) === null || _j === void 0 ? void 0 : _j.setBlox([newBlock]);
                        (_k = this.BloxManager) === null || _k === void 0 ? void 0 : _k.sendUpdateEvent();
                    }
                    return;
                }
                if (isBlockContext && blockElement) {
                    const isCursorAtStart = (_l = this.TypingManager) === null || _l === void 0 ? void 0 : _l.isCursorAtStart(blockElement);
                    const hasContent = !isEmpty(blockElement);
                    const previousBlock = (_m = this.BloxManager) === null || _m === void 0 ? void 0 : _m.getPreviousBlock(currentBlock.id);
                    const isSelection = (_o = this.TypingManager) === null || _o === void 0 ? void 0 : _o.hasTextSelection();
                    if (isCursorAtStart && blockElement && !isSelection) {
                        event.preventDefault();
                        if (hasContent && (previousBlock === null || previousBlock === void 0 ? void 0 : previousBlock.id)) {
                            (_p = this.BloxManager) === null || _p === void 0 ? void 0 : _p.merge(currentBlock.id);
                        }
                        else if (previousBlock === null || previousBlock === void 0 ? void 0 : previousBlock.id) {
                            (_q = this.DOMManager) === null || _q === void 0 ? void 0 : _q.focusBlock(previousBlock.id, true);
                            (_r = this.BloxManager) === null || _r === void 0 ? void 0 : _r.removeById(currentBlock.id);
                        }
                    }
                }
            }
            if (event.key === "Enter" && event.shiftKey) {
                return;
            }
            if (event.key === "Enter") {
                if (isBlockContext) {
                    event.preventDefault();
                    if (!blockElement)
                        return;
                    const selection = window.getSelection();
                    if (!blocksWithoutSelection.includes(currentBlock.type) &&
                        (!selection || !selection.rangeCount))
                        return;
                    const isCursorAtEnd = (_s = this.TypingManager) === null || _s === void 0 ? void 0 : _s.isCursorAtEnd(blockElement);
                    const isCursorAtStart = (_t = this.TypingManager) === null || _t === void 0 ? void 0 : _t.isCursorAtStart(blockElement);
                    switch (currentBlock.type) {
                        case BLOCK_TYPES.bulletedList:
                        case BLOCK_TYPES.numberedList: {
                            const currentLi = (_u = this.TypingManager) === null || _u === void 0 ? void 0 : _u.getCursorElementBySelector("li");
                            if (!currentLi)
                                return;
                            const parentList = currentLi.closest("ul, ol"); // Find the closest list
                            if (!parentList)
                                return;
                            if (isEmpty(currentLi)) {
                                const grandParentList = (_v = parentList.parentElement) === null || _v === void 0 ? void 0 : _v.closest("ul, ol");
                                if (grandParentList) {
                                    parentList.removeChild(currentLi);
                                    grandParentList.insertBefore(currentLi, parentList.nextSibling);
                                    (_w = this.DOMManager) === null || _w === void 0 ? void 0 : _w.focusElement(currentLi);
                                }
                                else {
                                    parentList.removeChild(currentLi);
                                    (_x = this.BloxManager) === null || _x === void 0 ? void 0 : _x.addBlockAfter(currentBlock.id, DEFAULT_BLOCK_TYPE);
                                    if (isEmpty(blockElement))
                                        (_y = this.BloxManager) === null || _y === void 0 ? void 0 : _y.removeById(currentBlock.id);
                                    return;
                                }
                            }
                            else {
                                const isCursorAtEnd = (_z = this.TypingManager) === null || _z === void 0 ? void 0 : _z.isCursorAtEnd(currentLi);
                                const isCursorAtStart = (_0 = this.TypingManager) === null || _0 === void 0 ? void 0 : _0.isCursorAtStart(currentLi);
                                if (isCursorAtEnd) {
                                    (_1 = this.DOMManager) === null || _1 === void 0 ? void 0 : _1.addElement("li", "after");
                                }
                                else if (isCursorAtStart) {
                                    (_2 = this.DOMManager) === null || _2 === void 0 ? void 0 : _2.addElement("li", "before");
                                }
                                else {
                                    (_3 = this.DOMManager) === null || _3 === void 0 ? void 0 : _3.splitElementBySelector("li");
                                }
                            }
                            return;
                        }
                        case BLOCK_TYPES.image: {
                            // Add block when click enter on the selected image.
                            (_4 = this.BloxManager) === null || _4 === void 0 ? void 0 : _4.addBlockAfter(currentBlock.id, DEFAULT_BLOCK_TYPE);
                            return;
                        }
                        default: {
                            if (isCursorAtEnd || isEmpty(blockElement)) {
                                (_5 = this.BloxManager) === null || _5 === void 0 ? void 0 : _5.addBlockAfter(currentBlock.id, DEFAULT_BLOCK_TYPE);
                            }
                            else if (isCursorAtStart) {
                                (_6 = this.BloxManager) === null || _6 === void 0 ? void 0 : _6.addBlockBefore(currentBlock.id, DEFAULT_BLOCK_TYPE);
                            }
                            else {
                                (_7 = this.BloxManager) === null || _7 === void 0 ? void 0 : _7.split(currentBlock.id);
                            }
                        }
                    }
                }
            }
            if (event.key === "Tab") {
                if (isBlockContext) {
                    event.preventDefault();
                    if (!blockElement)
                        return;
                    const currentLi = (_8 = this.TypingManager) === null || _8 === void 0 ? void 0 : _8.getCursorElementBySelector("li");
                    if (!currentLi)
                        return;
                    const parentList = currentLi.closest("ul, ol"); // Detect parent list type
                    if (!parentList)
                        return;
                    const newNestedList = (_9 = this.DOMManager) === null || _9 === void 0 ? void 0 : _9.wrapElement(currentLi, parentList.tagName);
                    if (newNestedList) {
                        requestAnimationFrame(() => {
                            var _a;
                            return (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.focusElement(newNestedList.querySelector("li"), true);
                        });
                    }
                }
            }
            if (["ArrowUp", "ArrowDown"].includes(event.key) && isBlockContext) {
                if (!blockElement)
                    return;
                const isAtBoundary = event.key === "ArrowUp"
                    ? (_10 = this.TypingManager) === null || _10 === void 0 ? void 0 : _10.isCursorAtStart(blockElement)
                    : (_11 = this.TypingManager) === null || _11 === void 0 ? void 0 : _11.isCursorAtEnd(blockElement);
                if (isAtBoundary) {
                    const targetBlock = event.key === "ArrowUp"
                        ? (_12 = this.BloxManager) === null || _12 === void 0 ? void 0 : _12.getPreviousBlock(currentBlock.id)
                        : (_13 = this.BloxManager) === null || _13 === void 0 ? void 0 : _13.getNextBlock(currentBlock.id);
                    if (!targetBlock)
                        return;
                    event.preventDefault();
                    (_14 = this.DOMManager) === null || _14 === void 0 ? void 0 : _14.focusBlock(targetBlock.id, event.key === "ArrowUp");
                }
            }
            if ((event.metaKey || event.ctrlKey) &&
                (event.key === "z" || event.key === "y")) {
                const isRedo = (event.metaKey && event.key === "y") ||
                    (event.ctrlKey && event.key === "y"); // Shift+Z for redo (or Y for Windows/Linux)
                event.preventDefault();
                isRedo ? (_15 = this.HistoryManager) === null || _15 === void 0 ? void 0 : _15.redo() : (_16 = this.HistoryManager) === null || _16 === void 0 ? void 0 : _16.undo();
            }
            // Default styling shortcuts
            if ((event.metaKey || event.ctrlKey) &&
                (event.key === "b" || event.key === "i" || event.key === "u")) {
                setTimeout(() => { var _a, _b; return (_b = (_a = this.BloxManager) === null || _a === void 0 ? void 0 : _a.getCurrentBlock()) === null || _b === void 0 ? void 0 : _b.sendUpdateStyleEvent(); }, 1000);
            }
        };
        window.addEventListener("keydown", this.shortcutHandler);
    }
    unregisterShortcuts() {
        if (this.shortcutHandler) {
            window.removeEventListener("keydown", this.shortcutHandler);
            this.shortcutHandler = null;
        }
    }
}
