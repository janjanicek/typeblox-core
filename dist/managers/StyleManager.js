import { AVAILABLE_FONTS, EVENTS, DEFAULT_STYLES } from "../constants";
import { toCssStyle } from "../utils/css";
import { EventEmitter } from "../classes/EventEmitter";
export class StyleManager extends EventEmitter {
    constructor() {
        super();
        this.TypingManager = null;
        this.DOMManager = null;
        this.LinkManager = null;
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
            isLink: false,
            textAlign: "left",
        };
        this.areDependenciesSet = () => this.TypingManager && this.DOMManager;
        this.getStyle = () => {
            var _a, _b;
            const selection = (_a = this.TypingManager) === null || _a === void 0 ? void 0 : _a.getSelectedElement();
            let currentNode = null;
            // If selection is a text node, move to its parent element
            if (selection) {
                if (selection.nodeType === Node.TEXT_NODE) {
                    currentNode = selection.parentElement;
                }
                else {
                    currentNode = selection;
                }
            }
            if (!currentNode) {
                currentNode = (_b = this.TypingManager) === null || _b === void 0 ? void 0 : _b.getCursorElement();
            }
            if (currentNode) {
                // Default styles
                const detectedStyles = {
                    color: null,
                    backgroundColor: null,
                    isBold: false,
                    isItalic: false,
                    isUnderline: false,
                    isStrikeout: false,
                    fontFamily: null,
                    isH1: false,
                    isH2: false,
                    isH3: false,
                    isParagraph: false,
                    isCode: false,
                    isLink: false,
                    textAlign: null,
                };
                const detectStylesOnNode = (node) => {
                    var _a, _b;
                    const computedStyle = window.getComputedStyle(node);
                    const hasDec = (sel) => !!node.querySelector(sel);
                    const blockType = (_a = node.closest("[data-typeblox-id]")) === null || _a === void 0 ? void 0 : _a.nodeName;
                    if (blockType) {
                        switch (blockType) {
                            case "H1":
                                detectedStyles.isH1 = true;
                                break;
                            case "H2":
                                detectedStyles.isH2 = true;
                                break;
                            case "H3":
                                detectedStyles.isH3 = true;
                                break;
                            case "P":
                                detectedStyles.isParagraph = true;
                                break;
                            case "CODE":
                                detectedStyles.isCode = true;
                                break;
                        }
                    }
                    if ((!detectedStyles.isBold &&
                        (computedStyle.fontWeight === "bold" ||
                            parseInt(computedStyle.fontWeight) >= 700 ||
                            node.matches("b,strong"))) ||
                        hasDec("b,strong")) {
                        detectedStyles.isBold = true;
                    }
                    if ((!detectedStyles.isItalic &&
                        (computedStyle.fontStyle === "italic" || node.matches("i,em"))) ||
                        hasDec("i,em")) {
                        detectedStyles.isItalic = true;
                    }
                    if ((!detectedStyles.isUnderline &&
                        (computedStyle.textDecoration.includes("underline") ||
                            node.matches("u"))) ||
                        hasDec("u")) {
                        detectedStyles.isUnderline = true;
                    }
                    if ((!detectedStyles.isStrikeout &&
                        (computedStyle.textDecoration.includes("line-through") ||
                            node.matches("s,strike"))) ||
                        hasDec("s,strike")) {
                        detectedStyles.isStrikeout = true;
                    }
                    // Detect color
                    if (!detectedStyles.color) {
                        detectedStyles.color = computedStyle.color || null;
                    }
                    // Detect background color
                    if (!detectedStyles.backgroundColor &&
                        computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)") {
                        detectedStyles.backgroundColor = computedStyle.backgroundColor;
                    }
                    // Detect font-family
                    if (!detectedStyles.fontFamily) {
                        const cleanFont = computedStyle.fontFamily.replace(/^"|"$/g, "");
                        if (cleanFont &&
                            AVAILABLE_FONTS.map((f) => f.toLowerCase()).includes(cleanFont.toLowerCase())) {
                            detectedStyles.fontFamily = cleanFont;
                        }
                        else {
                            detectedStyles.fontFamily = "Arial";
                        }
                    }
                    // Detect text alignment
                    if (!detectedStyles.textAlign) {
                        detectedStyles.textAlign = computedStyle.textAlign;
                    }
                    // Detect if it's a link
                    if (!detectedStyles.isLink &&
                        (node.matches("a[href]") ||
                            hasDec("a[href]") ||
                            ((_b = this.LinkManager) === null || _b === void 0 ? void 0 : _b.findClosestAnchor()) !== null)) {
                        detectedStyles.isLink = true;
                    }
                };
                // Traverse up from the text node
                while (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
                    if (currentNode.matches("[data-typeblox-id]") ||
                        currentNode.nodeName === "LI") {
                        break;
                    }
                    detectStylesOnNode(currentNode);
                    currentNode = currentNode.parentElement;
                }
                return detectedStyles;
            }
            // Return default styles if no valid selection is found
            return DEFAULT_STYLES;
        };
        this.clearFormat = (element) => {
            var _a, _b;
            if (!this.areDependenciesSet())
                return;
            const selection = (_a = this.TypingManager) === null || _a === void 0 ? void 0 : _a.getSelectedElement();
            const cursorElement = (_b = this.TypingManager) === null || _b === void 0 ? void 0 : _b.getCursorElement();
            let targetElement = element || selection || cursorElement;
            if (!targetElement) {
                console.warn("No selected or cursor element found for clearing formatting.");
                return;
            }
            // Ensure targetElement is the block element itself, not a child text node
            if (targetElement.nodeType === Node.TEXT_NODE) {
                targetElement = targetElement.parentElement;
            }
            // If a full block element (h1, p, li, etc.) is selected, clean only its children
            const isFullBlockSelected = (element) => {
                var _a;
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0)
                    return false;
                const range = selection.getRangeAt(0);
                while (element.parentElement &&
                    !element.matches("[data-typeblox-editor]")) {
                    if (((_a = element.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== range.toString().trim()) {
                        return false; // If parent has more content than the selection, it's a partial selection
                    }
                    element = element.parentElement;
                }
                return true; // If we reach the block and all content matches the selection, full block is selected
            };
            const removeFormatting = (element) => {
                if (element.nodeType === Node.ELEMENT_NODE) {
                    const parent = element.parentNode;
                    // Process children first (recursive)
                    Array.from(element.childNodes).forEach((child) => removeFormatting(child));
                    // Remove inline formatting tags while keeping content
                    if ([
                        "B",
                        "I",
                        "U",
                        "S",
                        "STRONG",
                        "EM",
                        "MARK",
                        "SPAN",
                        "STRIKE",
                    ].includes(element.nodeName)) {
                        while (element.firstChild) {
                            parent === null || parent === void 0 ? void 0 : parent.insertBefore(element.firstChild, element);
                        }
                        parent === null || parent === void 0 ? void 0 : parent.removeChild(element);
                    }
                    else if (element.style) {
                        element.removeAttribute("style");
                    }
                }
            };
            const mergeTextNodes = (element) => {
                var _a, _b;
                let child = element.firstChild;
                while (child) {
                    if (child.nodeType === Node.TEXT_NODE &&
                        ((_a = child.nextSibling) === null || _a === void 0 ? void 0 : _a.nodeType) === Node.TEXT_NODE) {
                        if (!child.textContent)
                            child.textContent = "";
                        child.textContent += child.nextSibling.textContent;
                        (_b = child.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(child.nextSibling);
                    }
                    else if (child.nodeType === Node.ELEMENT_NODE) {
                        mergeTextNodes(child);
                    }
                    child = child.nextSibling;
                }
            };
            if (isFullBlockSelected(targetElement)) {
                // Expand target to the full block
                targetElement = targetElement.closest("[data-typeblox-editor]");
                Array.from(targetElement.childNodes).forEach(removeFormatting);
            }
            else {
                // Otherwise, wrap selection and remove formatting inside
                const wrapSelection = () => {
                    const selection = window.getSelection();
                    if (!selection || selection.rangeCount === 0)
                        return null;
                    const range = selection.getRangeAt(0);
                    // Ensure the selection is not empty
                    if (range.collapsed)
                        return null;
                    const span = document.createElement("span");
                    span.setAttribute("data-temp-wrap", "true");
                    try {
                        // Attempt to wrap selection normally
                        range.surroundContents(span);
                    }
                    catch (error) {
                        console.warn("surroundContents failed, applying fallback.", error);
                        // Fallback: If selection spans multiple elements, extract and reinsert
                        const fragment = range.extractContents();
                        if (!fragment.childNodes.length) {
                            console.warn("Extracted fragment is empty, aborting wrap.");
                            return null;
                        }
                        span.appendChild(fragment);
                        // Insert the wrapped content back into the document
                        range.insertNode(span);
                        // Expand selection to include the new span
                        range.selectNode(span);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    return span;
                };
                let tempWrap = wrapSelection();
                if (tempWrap) {
                    removeFormatting(tempWrap);
                    const parent = tempWrap.parentNode;
                    while (tempWrap.firstChild) {
                        parent === null || parent === void 0 ? void 0 : parent.insertBefore(tempWrap.firstChild, tempWrap);
                    }
                    parent === null || parent === void 0 ? void 0 : parent.removeChild(tempWrap);
                }
            }
            mergeTextNodes(targetElement);
        };
        this.currentStyles = this.getStyle();
    }
    setDependencies(DOMManager, TypingManager, LinkManager) {
        this.DOMManager = DOMManager;
        this.TypingManager = TypingManager;
        this.LinkManager = LinkManager;
    }
    /**
     * Applies formatting to the selected text.
     * This method handles various scenarios including:
     * - Applying formatting to a text selection
     * - Handling nested formatting
     * - Applying styles to existing formatted elements
     * - Handling complex DOM structures
     *
     * @param tagName - The HTML tag to apply (e.g., 'strong', 'em', 'u')
     * @param style - Optional styles to apply to the element
     * @returns boolean - Whether the formatting was applied successfully
     */
    applyFormat(tagName, style) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        if (!this.areDependenciesSet())
            return false;
        const contentElement = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElement();
        if (!contentElement)
            return false;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return false;
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        if (!selectedText.trim())
            return false; // No meaningful selection
        const selectedElement = (_b = this.TypingManager) === null || _b === void 0 ? void 0 : _b.getSelectedElement();
        if (!selectedElement)
            return false;
        // Save selection state for later restoration
        (_c = this.TypingManager) === null || _c === void 0 ? void 0 : _c.saveSelection();
        try {
            const targetElement = selectedElement.nodeType === Node.TEXT_NODE
                ? selectedElement.parentElement
                : selectedElement;
            if (!targetElement)
                return false;
            let matchingParentTag = targetElement.closest(tagName);
            let matchingParentStyle = null;
            // If style is provided, check if an element with the same style exists
            if (style && Object.keys(style).length > 0) {
                const leadingStyle = Object.keys(style)[0];
                const styleKey = toCssStyle(leadingStyle);
                matchingParentStyle = targetElement.closest(`${tagName}[style*="${styleKey}"]`);
                // If we found a matching parent with the same style and it contains exactly our selection,
                // just update its styles instead of creating a new element
                if (matchingParentStyle &&
                    ((_d = matchingParentStyle.textContent) === null || _d === void 0 ? void 0 : _d.trim()) ===
                        ((_e = targetElement === null || targetElement === void 0 ? void 0 : targetElement.textContent) === null || _e === void 0 ? void 0 : _e.trim())) {
                    Object.keys(style).forEach((key) => {
                        matchingParentStyle.style[key] = style[key];
                    });
                    // Restore selection after applying style
                    (_f = this.TypingManager) === null || _f === void 0 ? void 0 : _f.restoreSelection();
                    return true;
                }
            }
            else if (matchingParentTag) {
                // If we already have this tag applied to the exact selection, don't apply it again
                if (((_g = matchingParentTag.textContent) === null || _g === void 0 ? void 0 : _g.trim()) === selectedText.trim()) {
                    // Restore selection and return
                    (_h = this.TypingManager) === null || _h === void 0 ? void 0 : _h.restoreSelection();
                    return false;
                }
            }
            // Handle partial text selection by splitting text nodes
            if (selectedElement.nodeType === Node.TEXT_NODE) {
                const textNode = selectedElement;
                const textContent = textNode.textContent;
                const startOffset = range.startOffset;
                const endOffset = range.endOffset;
                const beforeText = textContent.slice(0, startOffset);
                const selectedPart = textContent.slice(startOffset, endOffset);
                const afterText = textContent.slice(endOffset);
                const wrapper = document.createElement(tagName);
                wrapper.textContent = selectedPart;
                if (style) {
                    Object.keys(style).forEach((key) => {
                        wrapper.style[key] = style[key];
                    });
                }
                const parentElement = textNode.parentElement;
                if (beforeText) {
                    const beforeNode = document.createTextNode(beforeText);
                    parentElement.insertBefore(beforeNode, textNode);
                }
                parentElement.insertBefore(wrapper, textNode);
                if (afterText) {
                    const afterNode = document.createTextNode(afterText);
                    parentElement.insertBefore(afterNode, textNode);
                }
                textNode.remove();
                // Try to merge adjacent identical elements
                if (parentElement) {
                    (_j = this.TypingManager) === null || _j === void 0 ? void 0 : _j.mergeConsecutiveStyledElements(parentElement);
                }
            }
            else {
                // If not a text node, wrap the entire selection
                try {
                    const wrapper = document.createElement(tagName);
                    if (style) {
                        Object.keys(style).forEach((key) => {
                            wrapper.style[key] = style[key];
                        });
                    }
                    // Try to use surroundContents, but it can fail if the selection spans multiple elements
                    try {
                        range.surroundContents(wrapper);
                    }
                    catch (e) {
                        // Fallback for complex selections that span multiple elements
                        console.warn("surroundContents failed, using extractContents fallback");
                        const fragment = range.extractContents();
                        wrapper.appendChild(fragment);
                        range.insertNode(wrapper);
                    }
                    // Try to merge adjacent identical elements
                    if (wrapper.parentElement) {
                        (_k = this.TypingManager) === null || _k === void 0 ? void 0 : _k.mergeConsecutiveStyledElements(wrapper.parentElement);
                    }
                }
                catch (error) {
                    console.error("Error applying format:", error);
                    // Restore selection even if there was an error
                    (_l = this.TypingManager) === null || _l === void 0 ? void 0 : _l.restoreSelection();
                    return false;
                }
            }
            // Restore selection after applying style
            (_m = this.TypingManager) === null || _m === void 0 ? void 0 : _m.restoreSelection();
            return true;
        }
        catch (error) {
            console.error("Error in applyFormat:", error);
            // Try to restore selection even if there was an error
            (_o = this.TypingManager) === null || _o === void 0 ? void 0 : _o.restoreSelection();
            return false;
        }
    }
    /**
     * Removes formatting from the selected text.
     * This method handles various scenarios including:
     * - Removing formatting from a text selection
     * - Handling nested formatting
     * - Removing styles from formatted elements
     *
     * @param tagName - The HTML tag to remove (e.g., 'strong', 'em', 'u')
     * @param styleKey - Optional style property to remove
     * @returns boolean - Whether the formatting was removed successfully
     */
    unapplyFormat(tagName, styleKey = null) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!this.areDependenciesSet())
            return false;
        let selectedElement = (_a = this.TypingManager) === null || _a === void 0 ? void 0 : _a.getSelectedElement();
        if (!selectedElement)
            return false;
        // Save selection state for later restoration
        (_b = this.TypingManager) === null || _b === void 0 ? void 0 : _b.saveSelection();
        try {
            // Ensure selectedElement is an HTMLElement before calling .closest()
            const targetElement = selectedElement.nodeType === Node.TEXT_NODE
                ? selectedElement.parentElement
                : selectedElement;
            if (!targetElement) {
                (_c = this.TypingManager) === null || _c === void 0 ? void 0 : _c.restoreSelection();
                return false;
            }
            const matchingParent = targetElement.closest(tagName);
            const isMatchingSelection = ((_d = targetElement.textContent) === null || _d === void 0 ? void 0 : _d.trim()) ===
                ((_e = matchingParent === null || matchingParent === void 0 ? void 0 : matchingParent.textContent) === null || _e === void 0 ? void 0 : _e.trim());
            const matchingChildren = targetElement.querySelectorAll(tagName);
            // Remove nested tags first
            if (matchingChildren.length > 0) {
                Array.from(matchingChildren).forEach((element) => {
                    var _a;
                    (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.removeElement(element);
                });
            }
            // If the whole selection is wrapped in the tag, remove it
            if (matchingParent && isMatchingSelection) {
                (_f = this.DOMManager) === null || _f === void 0 ? void 0 : _f.removeElement(matchingParent);
            }
            // Handle inline styles removal
            if (styleKey) {
                const closestStyledElement = targetElement.closest(tagName);
                if (closestStyledElement &&
                    closestStyledElement.style[styleKey]) {
                    closestStyledElement.style.removeProperty(styleKey);
                }
            }
            this.unapplyAliases(tagName);
            // Restore selection after removing formatting
            (_g = this.TypingManager) === null || _g === void 0 ? void 0 : _g.restoreSelection();
            return true;
        }
        catch (error) {
            console.error("Error in unapplyFormat:", error);
            // Try to restore selection even if there was an error
            (_h = this.TypingManager) === null || _h === void 0 ? void 0 : _h.restoreSelection();
            return false;
        }
    }
    unapplyAliases(tagName) {
        if (tagName === "strong") {
            this.unapplyFormat("b");
            this.unapplyFormat("bold");
        }
        if (tagName === "i") {
            this.unapplyFormat("em");
        }
    }
    updateCurrentStyles(block) {
        const detectedStyles = this.getStyle();
        // Update `currentStyles` with the detected styles
        this.currentStyles = Object.assign(Object.assign({}, this.currentStyles), detectedStyles);
        // Optionally, emit a high-level styleChange event for external listeners
        this.emit(EVENTS.styleChange, block);
    }
}
