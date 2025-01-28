import { CLASSES } from "../constants";
export class TypingManager {
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
        const ignoreTags = ["LI"];
        let i = 0;
        while (i < childNodes.length - 1) {
            const currentNode = childNodes[i];
            const nextNode = childNodes[i + 1];
            // Ensure both nodes are elements
            if (currentNode.nodeType === Node.ELEMENT_NODE &&
                nextNode.nodeType === Node.ELEMENT_NODE) {
                const currentElement = currentNode;
                const nextElement = nextNode;
                // Skip elements with tag names in the ignore list
                if (ignoreTags.includes(currentElement.tagName) ||
                    ignoreTags.includes(nextElement.tagName)) {
                    i++;
                    continue;
                }
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
        wrapper.className = CLASSES.selected;
        wrapper.appendChild(customRange.extractContents());
        customRange.insertNode(wrapper);
    }
    getSelectedElement(wrapper = document) {
        const selectionElement = wrapper.querySelector(`.${CLASSES.selected}`);
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
        const selectedElements = blockElement.querySelectorAll(`.${CLASSES.selected}`);
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
            console.log(element);
            parent === null || parent === void 0 ? void 0 : parent.removeChild(element);
        });
        this.mergeConsecutiveStyledElements(blockElement);
    }
    isCursorAtStart(container = null) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return false;
        }
        const range = selection.getRangeAt(0);
        const targetContainer = container || range.commonAncestorContainer;
        // If the container is a text node
        if (targetContainer.nodeType === Node.TEXT_NODE) {
            return range.startOffset === 0;
        }
        // If the container is an element, check its first child
        let current = targetContainer.firstChild;
        while (current && current.nodeType !== Node.TEXT_NODE) {
            current = current.firstChild;
        }
        return current ? range.startOffset === 0 : true;
    }
    isCursorAtEnd(container = null) {
        var _a, _b;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return false;
        }
        const range = selection.getRangeAt(0);
        const targetContainer = container || range.commonAncestorContainer;
        // If the container is a text node
        if (targetContainer.nodeType === Node.TEXT_NODE) {
            return range.endOffset === ((_a = targetContainer.textContent) === null || _a === void 0 ? void 0 : _a.length);
        }
        // If the container is an element, navigate to the last child text node
        let current = targetContainer.lastChild;
        while (current && current.nodeType !== Node.TEXT_NODE) {
            current = current.lastChild;
        }
        return current ? range.endOffset === ((_b = current.textContent) === null || _b === void 0 ? void 0 : _b.length) : true; // Assume at the end if no more content
    }
}
