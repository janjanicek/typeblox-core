import { AVAILABLE_FONTS, EVENTS, CLASSES } from "../constants";
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
            var _a, _b, _c;
            const selection = (_a = this.TypingManager) === null || _a === void 0 ? void 0 : _a.getSelectedElement();
            let currentNode = (selection ? selection : (_b = this.TypingManager) === null || _b === void 0 ? void 0 : _b.getCursorElement());
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
                    var _a, _b, _c;
                    const computedStyle = window.getComputedStyle(node);
                    const blockType = (_a = currentNode.closest("[data-typeblox-id]")) === null || _a === void 0 ? void 0 : _a.nodeName;
                    if (blockType && blockType === "H1") {
                        detectedStyles.isH1 = true;
                    }
                    if (blockType && blockType === "H2") {
                        detectedStyles.isH2 = true;
                    }
                    if (blockType && blockType === "H3") {
                        detectedStyles.isH2 = true;
                    }
                    if (blockType && blockType === "P") {
                        detectedStyles.isParagraph = true;
                    }
                    if (blockType && blockType === "CODE") {
                        detectedStyles.isCode = true;
                    }
                    if (!detectedStyles.isBold &&
                        (computedStyle.fontWeight.toString() >= "700" || node.matches("b"))) {
                        detectedStyles.isBold = true;
                    }
                    if (!detectedStyles.isItalic &&
                        (computedStyle.fontStyle === "italic" || node.matches("i"))) {
                        detectedStyles.isItalic = true;
                    }
                    if (!detectedStyles.isUnderline &&
                        (computedStyle.textDecoration.includes("underline") ||
                            node.matches("u"))) {
                        detectedStyles.isUnderline = true;
                    }
                    if (!detectedStyles.isStrikeout &&
                        (computedStyle.textDecoration.includes("line-through") ||
                            node.matches("s"))) {
                        detectedStyles.isStrikeout = true;
                    }
                    // Detect color
                    if (!detectedStyles.color) {
                        detectedStyles.color = computedStyle.color || null;
                    }
                    // Detect background color
                    if (!detectedStyles.backgroundColor && ((_b = node.style) === null || _b === void 0 ? void 0 : _b.backgroundColor)) {
                        detectedStyles.backgroundColor = node.style.backgroundColor;
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
                    // Alignment:
                    if (!detectedStyles.textAlign && computedStyle.textAlign) {
                        detectedStyles.textAlign = computedStyle.textAlign;
                    }
                    if (!detectedStyles.isLink) {
                        detectedStyles.isLink =
                            ((_c = this.LinkManager) === null || _c === void 0 ? void 0 : _c.findClosestAnchor()) !== null || false;
                    }
                };
                if (currentNode.childNodes.length === 1 &&
                    ((_c = currentNode.firstChild) === null || _c === void 0 ? void 0 : _c.nodeType) === Node.ELEMENT_NODE) {
                    const firstChild = currentNode.firstChild;
                    if (firstChild.matches("b, i, s, u")) {
                        detectStylesOnNode(firstChild);
                    }
                }
                // Traverse up the DOM tree
                while (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
                    if (currentNode.matches("p[data-typeblox-editor]")) {
                        break;
                    }
                    // Detect styles on the current node
                    detectStylesOnNode(currentNode);
                    // Move up to the parent node
                    currentNode = currentNode.parentElement;
                }
                return detectedStyles;
            }
            // Return default styles if no selection is found
            return {
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
                textAlign: "left",
            };
        };
        this.clearFormat = (element) => {
            var _a, _b, _c, _d, _e;
            if (!this.areDependenciesSet())
                return;
            const selection = (_a = this.TypingManager) === null || _a === void 0 ? void 0 : _a.getSelectedElement();
            const cursorElement = (_b = this.TypingManager) === null || _b === void 0 ? void 0 : _b.getCursorElement();
            // Determine the current node to operate on
            let targetElement = element || selection || cursorElement;
            if (!targetElement) {
                console.warn("No selected or cursor element found for clearing formatting.");
                return;
            }
            const removeFormatting = (element) => {
                if (element.nodeType === Node.ELEMENT_NODE) {
                    const parent = element.parentNode;
                    // Skip <span> with "typeblox-selected" class
                    if (element.nodeName === "SPAN" &&
                        element.classList.contains(CLASSES.selected)) {
                        Array.from(element.childNodes).forEach((child) => removeFormatting(child));
                        return;
                    }
                    // Process all child nodes first (to handle deeply nested cases)
                    Array.from(element.childNodes).forEach((child) => removeFormatting(child));
                    // Unwrap formatting tags and preserve their content
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
                    else {
                        // Remove inline styles if present
                        if (element.style) {
                            element.removeAttribute("style");
                        }
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
            while (((_d = (_c = targetElement.parentElement) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) ==
                ((_e = targetElement.textContent) === null || _e === void 0 ? void 0 : _e.trim())) {
                targetElement = targetElement === null || targetElement === void 0 ? void 0 : targetElement.parentElement;
                if (targetElement.matches("p[data-typeblox-editor]")) {
                    break;
                }
            }
            // Apply formatting removal
            removeFormatting(targetElement);
            // Merge text nodes after cleanup
            mergeTextNodes(targetElement);
        };
        this.currentStyles = this.getStyle();
    }
    setDependencies(DOMManager, TypingManager, LinkManager) {
        this.DOMManager = DOMManager;
        this.TypingManager = TypingManager;
        this.LinkManager = LinkManager;
    }
    applyFormat(tagName, style) {
        var _a, _b, _c, _d, _e;
        if (!this.areDependenciesSet())
            return;
        const contentElement = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElement();
        if (!contentElement)
            return;
        const selectedElement = (_b = this.TypingManager) === null || _b === void 0 ? void 0 : _b.getSelectedElement(contentElement);
        if (!selectedElement || ((_c = selectedElement.textContent) === null || _c === void 0 ? void 0 : _c.trim()) === "") {
            return;
        }
        let matchingParentStyle = null;
        let matchingParentTag = selectedElement.closest(`${tagName}`);
        if (style && Object.keys(style).length > 0) {
            const leadingStyle = Object.keys(style)[0];
            const styleKey = toCssStyle(leadingStyle);
            matchingParentStyle = selectedElement.closest(`${tagName}[style*=${styleKey}]`);
            if (matchingParentStyle &&
                ((_d = matchingParentStyle.textContent) === null || _d === void 0 ? void 0 : _d.trim()) ===
                    ((_e = selectedElement === null || selectedElement === void 0 ? void 0 : selectedElement.textContent) === null || _e === void 0 ? void 0 : _e.trim())) {
                Object.keys(style).forEach((key) => {
                    matchingParentStyle.style[key] = style[key];
                });
                return;
            }
        }
        else if (matchingParentTag) {
            return;
        }
        const wrapper = document.createElement(tagName);
        if (style) {
            Object.keys(style).forEach((key) => {
                wrapper.style[key] = style[key];
            });
        }
        const parentElement = selectedElement.parentElement;
        if (parentElement) {
            parentElement.replaceChild(wrapper, selectedElement);
            wrapper.appendChild(selectedElement);
        }
        else {
            selectedElement.replaceWith(wrapper);
            wrapper.appendChild(selectedElement);
        }
    }
    unapplyFormat(tagName, styleKey = null) {
        var _a, _b, _c, _d, _e;
        if (!this.areDependenciesSet())
            return;
        const selectedElement = (_a = this.TypingManager) === null || _a === void 0 ? void 0 : _a.getSelectedElement(document);
        if (!selectedElement) {
            return;
        }
        const matchingParent = selectedElement.closest(tagName);
        const isMatchingSelection = ((_b = selectedElement.textContent) === null || _b === void 0 ? void 0 : _b.trim()) ===
            ((_c = matchingParent === null || matchingParent === void 0 ? void 0 : matchingParent.textContent) === null || _c === void 0 ? void 0 : _c.trim());
        const matchingChildren = selectedElement.querySelectorAll(tagName);
        if (matchingChildren.length > 0) {
            Array.from(matchingChildren).forEach((element) => {
                var _a;
                (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.removeElement(element);
            });
        }
        if (matchingParent && isMatchingSelection) {
            (_d = this.DOMManager) === null || _d === void 0 ? void 0 : _d.removeElement(matchingParent);
            (_e = this.TypingManager) === null || _e === void 0 ? void 0 : _e.selectAllTextInSelectedElement();
        }
        if (styleKey) {
            const closestStyledElement = selectedElement.closest(`${tagName}`);
            if (closestStyledElement && closestStyledElement.style[styleKey]) {
                closestStyledElement.style.removeProperty(styleKey);
            }
        }
        this.unapplyAliases(tagName);
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
