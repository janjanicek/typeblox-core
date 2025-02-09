import { isEmpty } from "../utils/elements";
import { BLOCK_TYPES, DEFAULT_BLOCK_TYPE } from "../constants";
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14;
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
                        (_k = this.BloxManager) === null || _k === void 0 ? void 0 : _k.selectAllBlox(false);
                    }
                    return;
                }
                if (isBlockContext && blockElement) {
                    const isCursorAtStart = (_l = this.TypingManager) === null || _l === void 0 ? void 0 : _l.isCursorAtStart(blockElement);
                    const hasContent = !isEmpty(blockElement);
                    const previousBlock = (_m = this.BloxManager) === null || _m === void 0 ? void 0 : _m.getPreviousBlock(currentBlock.id);
                    if (isCursorAtStart && blockElement) {
                        event.preventDefault();
                        if (hasContent && (previousBlock === null || previousBlock === void 0 ? void 0 : previousBlock.id)) {
                            (_o = this.BloxManager) === null || _o === void 0 ? void 0 : _o.merge(currentBlock.id);
                        }
                        else if (previousBlock === null || previousBlock === void 0 ? void 0 : previousBlock.id) {
                            (_p = this.DOMManager) === null || _p === void 0 ? void 0 : _p.focusBlock(previousBlock.id, true);
                            (_q = this.BloxManager) === null || _q === void 0 ? void 0 : _q.removeById(currentBlock.id);
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
                    if (!selection || !selection.rangeCount)
                        return;
                    const isCursorAtEnd = (_r = this.TypingManager) === null || _r === void 0 ? void 0 : _r.isCursorAtEnd(blockElement);
                    const isCursorAtStart = (_s = this.TypingManager) === null || _s === void 0 ? void 0 : _s.isCursorAtStart(blockElement);
                    switch (currentBlock.type) {
                        case BLOCK_TYPES.bulletedList:
                        case BLOCK_TYPES.numberedList: {
                            const currentLi = (_t = this.TypingManager) === null || _t === void 0 ? void 0 : _t.getCursorElementBySelector("li");
                            if (!currentLi)
                                return;
                            const parentList = currentLi.closest("ul, ol"); // Find the closest list
                            if (!parentList)
                                return;
                            if (isEmpty(currentLi)) {
                                const grandParentList = (_u = parentList.parentElement) === null || _u === void 0 ? void 0 : _u.closest("ul, ol");
                                if (grandParentList) {
                                    parentList.removeChild(currentLi);
                                    grandParentList.insertBefore(currentLi, parentList.nextSibling);
                                    (_v = this.DOMManager) === null || _v === void 0 ? void 0 : _v.focusElement(currentLi);
                                }
                                else {
                                    parentList.removeChild(currentLi);
                                    (_w = this.BloxManager) === null || _w === void 0 ? void 0 : _w.addBlockAfter(currentBlock.id, DEFAULT_BLOCK_TYPE);
                                    if (isEmpty(blockElement))
                                        (_x = this.BloxManager) === null || _x === void 0 ? void 0 : _x.removeById(currentBlock.id);
                                    return;
                                }
                            }
                            else {
                                const isCursorAtEnd = (_y = this.TypingManager) === null || _y === void 0 ? void 0 : _y.isCursorAtEnd(currentLi);
                                const isCursorAtStart = (_z = this.TypingManager) === null || _z === void 0 ? void 0 : _z.isCursorAtStart(currentLi);
                                if (isCursorAtEnd) {
                                    (_0 = this.DOMManager) === null || _0 === void 0 ? void 0 : _0.addElement("li", "after");
                                }
                                else if (isCursorAtStart) {
                                    (_1 = this.DOMManager) === null || _1 === void 0 ? void 0 : _1.addElement("li", "before");
                                }
                                else {
                                    (_2 = this.DOMManager) === null || _2 === void 0 ? void 0 : _2.splitElementBySelector("li");
                                }
                            }
                            return;
                        }
                        default: {
                            if (isCursorAtEnd || isEmpty(blockElement)) {
                                (_3 = this.BloxManager) === null || _3 === void 0 ? void 0 : _3.addBlockAfter(currentBlock.id, DEFAULT_BLOCK_TYPE);
                            }
                            else if (isCursorAtStart) {
                                (_4 = this.BloxManager) === null || _4 === void 0 ? void 0 : _4.addBlockBefore(currentBlock.id, DEFAULT_BLOCK_TYPE);
                            }
                            else {
                                (_5 = this.BloxManager) === null || _5 === void 0 ? void 0 : _5.split(currentBlock.id);
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
                    const currentLi = (_6 = this.TypingManager) === null || _6 === void 0 ? void 0 : _6.getCursorElementBySelector("li");
                    if (!currentLi)
                        return;
                    const parentList = currentLi.closest("ul, ol"); // Detect parent list type
                    if (!parentList)
                        return;
                    const newNestedList = (_7 = this.DOMManager) === null || _7 === void 0 ? void 0 : _7.wrapElement(currentLi, parentList.tagName);
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
                    ? (_8 = this.TypingManager) === null || _8 === void 0 ? void 0 : _8.isCursorAtStart(blockElement)
                    : (_9 = this.TypingManager) === null || _9 === void 0 ? void 0 : _9.isCursorAtEnd(blockElement);
                if (isAtBoundary) {
                    const targetBlock = event.key === "ArrowUp"
                        ? (_10 = this.BloxManager) === null || _10 === void 0 ? void 0 : _10.getPreviousBlock(currentBlock.id)
                        : (_11 = this.BloxManager) === null || _11 === void 0 ? void 0 : _11.getNextBlock(currentBlock.id);
                    if (!targetBlock)
                        return;
                    event.preventDefault();
                    (_12 = this.DOMManager) === null || _12 === void 0 ? void 0 : _12.focusBlock(targetBlock.id, event.key === "ArrowUp");
                }
            }
            if ((event.metaKey || event.ctrlKey) &&
                (event.key === "z" || event.key === "y")) {
                const isRedo = (event.metaKey && event.key === "y") ||
                    (event.ctrlKey && event.key === "y"); // Shift+Z for redo (or Y for Windows/Linux)
                event.preventDefault();
                isRedo ? (_13 = this.HistoryManager) === null || _13 === void 0 ? void 0 : _13.redo() : (_14 = this.HistoryManager) === null || _14 === void 0 ? void 0 : _14.undo();
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
