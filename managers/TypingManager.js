"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypingManager = void 0;
const constants_1 = require("../constants");
class TypingManager {
    constructor() {
        this.lastRange = null;
        this.lastRangeElement = null;
    }
    saveSelectionRange() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null; // No selection or cursor
        }
        const range = selection.getRangeAt(0); // Get the current selection range
        this.lastRange = range;
        this.lastRangeElement =
            range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
                ? range.commonAncestorContainer
                : range.commonAncestorContainer.parentElement;
    }
    restoreSelectionRange() {
        if (!this.lastRange) {
            return; // Nothing to restore
        }
        const selection = window.getSelection();
        if (!selection) {
            return;
        }
        selection.removeAllRanges();
        const range = document.createRange();
        range.setStart(this.lastRange.startContainer, this.lastRange.startOffset);
        range.setEnd(this.lastRange.endContainer, this.lastRange.endOffset);
        selection.addRange(range);
    }
    mergeConsecutiveStyledElements(blockElement) {
        const childNodes = Array.from(blockElement.childNodes);
        let i = 0;
        while (i < childNodes.length - 1) {
            const currentNode = childNodes[i];
            const nextNode = childNodes[i + 1];
            // Ensure both nodes are elements
            if (currentNode.nodeType === Node.ELEMENT_NODE &&
                nextNode.nodeType === Node.ELEMENT_NODE) {
                const currentElement = currentNode;
                const nextElement = nextNode;
                // Check if both elements have the same tag and style
                if (currentElement.tagName === nextElement.tagName &&
                    currentElement.getAttribute("style") ===
                        nextElement.getAttribute("style")) {
                    // Merge the text content of the two elements
                    currentElement.textContent =
                        (currentElement.textContent || "") +
                            (nextElement.textContent || "");
                    nextElement.remove();
                    childNodes.splice(i + 1, 1);
                    continue;
                }
            }
            i++;
        }
    }
    createSelectedElement(range) {
        let customRange = range;
        if (customRange) {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0)
                return;
            customRange = selection.getRangeAt(0);
        }
        if (!customRange)
            return;
        const wrapper = document.createElement("span");
        wrapper.className = constants_1.CLASSES.selected;
        wrapper.appendChild(customRange.extractContents());
        customRange.insertNode(wrapper);
    }
    getSelectedElement(wrapper = document) {
        const selectionElement = wrapper.querySelector(`.${constants_1.CLASSES.selected}`);
        return selectionElement;
    }
    getCursorElement() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        return container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container;
    }
    selectAllTextInSelectedElement() {
        let selectedElement = this.getSelectedElement();
        if (!selectedElement) {
            this.createSelectedElement();
            selectedElement = this.getSelectedElement();
        }
        if (!selectedElement) {
            console.warn("No .selected element found.");
            return;
        }
        // Create a new range
        const range = document.createRange();
        try {
            // Set the range to start at the beginning and end at the last character of the `.selected` element
            range.selectNodeContents(selectedElement);
            // Clear any existing selections
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
        catch (error) {
            console.error("Error selecting text:", error);
        }
    }
    removeSelection(blockElement) {
        if (!blockElement)
            return;
        const selectedElements = blockElement.querySelectorAll(`.${constants_1.CLASSES.selected}`);
        selectedElements.forEach((element) => {
            const parent = element.parentNode;
            if (element.innerHTML.trim() === "") {
                // remove empty selected element
                if (element.innerHTML === " ") {
                    const spaceNode = document.createTextNode(" ");
                    parent === null || parent === void 0 ? void 0 : parent.replaceChild(spaceNode, element);
                }
                else {
                    // Otherwise, remove the empty selected element
                    element.remove();
                }
                return;
            }
            while (element.firstChild) {
                parent === null || parent === void 0 ? void 0 : parent.insertBefore(element.firstChild, element);
            }
            parent === null || parent === void 0 ? void 0 : parent.removeChild(element);
        });
        this.mergeConsecutiveStyledElements(blockElement);
    }
}
exports.TypingManager = TypingManager;
