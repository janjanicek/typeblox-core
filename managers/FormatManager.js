"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatManager = void 0;
const constants_1 = require("../constants");
const css_1 = require("../utils/css");
class FormatManager {
    constructor(TypingManager, DOMManager) {
        this.getStyle = () => {
            var _a;
            const selection = this.TypingManager.getSelectedElement();
            let currentNode = (selection ? selection : this.TypingManager.getCursorElement());
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
                };
                const detectStylesOnNode = (node) => {
                    var _a, _b;
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
                            constants_1.AVAILABLE_FONTS.map((f) => f.toLowerCase()).includes(cleanFont.toLowerCase())) {
                            detectedStyles.fontFamily = cleanFont;
                        }
                        else {
                            detectedStyles.fontFamily = "Arial";
                        }
                    }
                };
                if (currentNode.childNodes.length === 1 &&
                    ((_a = currentNode.firstChild) === null || _a === void 0 ? void 0 : _a.nodeType) === Node.ELEMENT_NODE) {
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
            };
        };
        this.clearFormat = (element) => {
            var _a, _b, _c;
            const selection = this.TypingManager.getSelectedElement();
            const cursorElement = this.TypingManager.getCursorElement();
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
                        element.classList.contains(constants_1.CLASSES.selected)) {
                        Array.from(element.childNodes).forEach((child) => removeFormatting(child));
                        return;
                    }
                    // Process all child nodes first (to handle deeply nested cases)
                    Array.from(element.childNodes).forEach((child) => removeFormatting(child));
                    // Unwrap formatting tags and preserve their content
                    if (["B", "I", "U", "S", "STRONG", "EM", "MARK", "SPAN"].includes(element.nodeName)) {
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
            while (((_b = (_a = targetElement.parentElement) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) ==
                ((_c = targetElement.textContent) === null || _c === void 0 ? void 0 : _c.trim())) {
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
        this.TypingManager = TypingManager;
        this.DOMManager = DOMManager;
    }
    applyFormat(tagName, style) {
        var _a, _b, _c;
        const contentElement = this.DOMManager.getBlockElement();
        if (!contentElement)
            return;
        const selectedElement = this.TypingManager.getSelectedElement(contentElement);
        if (!selectedElement || ((_a = selectedElement.textContent) === null || _a === void 0 ? void 0 : _a.trim()) === "") {
            return;
        }
        let matchingParentStyle = null;
        let matchingParentTag = selectedElement.closest(`${tagName}`);
        if (style && Object.keys(style).length > 0) {
            const leadingStyle = Object.keys(style)[0];
            const styleKey = (0, css_1.toCssStyle)(leadingStyle);
            matchingParentStyle = selectedElement.closest(`${tagName}[style*=${styleKey}]`);
            if (matchingParentStyle &&
                ((_b = matchingParentStyle.textContent) === null || _b === void 0 ? void 0 : _b.trim()) ===
                    ((_c = selectedElement === null || selectedElement === void 0 ? void 0 : selectedElement.textContent) === null || _c === void 0 ? void 0 : _c.trim())) {
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
        var _a, _b;
        const selectedElement = this.TypingManager.getSelectedElement(document);
        if (!selectedElement) {
            return;
        }
        const matchingParent = selectedElement.closest(tagName);
        const isMatchingSelection = ((_a = selectedElement.textContent) === null || _a === void 0 ? void 0 : _a.trim()) ===
            ((_b = matchingParent === null || matchingParent === void 0 ? void 0 : matchingParent.textContent) === null || _b === void 0 ? void 0 : _b.trim());
        const matchingChildren = selectedElement.querySelectorAll(tagName);
        if (matchingChildren.length > 0) {
            Array.from(matchingChildren).forEach((element) => {
                this.DOMManager.removeElement(element);
            });
        }
        if (matchingParent && isMatchingSelection) {
            this.DOMManager.removeElement(matchingParent);
            this.TypingManager.selectAllTextInSelectedElement();
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
}
exports.FormatManager = FormatManager;
