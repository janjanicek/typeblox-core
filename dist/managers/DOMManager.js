import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../constants";
import { getAllowedAttributes } from "../utils/attributes";
export class DOMManager {
    constructor(initialBloxManager) {
        this.BloxManager = null;
        this.removeElement = (matchingParent) => {
            const parentElement = matchingParent.parentElement;
            if (!parentElement) {
                console.warn("Cannot remove element because it has no parent.");
                return;
            }
            while (matchingParent.firstChild) {
                parentElement.insertBefore(matchingParent.firstChild, matchingParent);
            }
            parentElement.removeChild(matchingParent);
        };
        this.sanitizeHTML = (html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            // Remove all style attributes from elements
            const elements = doc.body.querySelectorAll("*");
            elements.forEach((el) => {
                el.removeAttribute("style");
            });
            // Allow only certain tags
            const allowedTags = [
                "b",
                "i",
                "u",
                "a",
                "p",
                "br",
                "ul",
                "ol",
                "li",
                "blockquote",
            ];
            const sanitizeNode = (node) => {
                if (!allowedTags.includes(node.tagName.toLowerCase())) {
                    // Remove disallowed tags and their content for specific tags
                    if (["script", "style"].includes(node.tagName.toLowerCase())) {
                        node.remove(); // Remove the entire tag
                        return;
                    }
                    // Replace other disallowed tags with their inner content
                    const parent = node.parentNode;
                    while (node.firstChild) {
                        parent === null || parent === void 0 ? void 0 : parent.insertBefore(node.firstChild, node);
                    }
                    parent === null || parent === void 0 ? void 0 : parent.removeChild(node);
                }
            };
            doc.body.querySelectorAll("*").forEach(sanitizeNode);
            return doc.body.innerHTML; // Return the sanitized HTML
        };
        this.isEmptyContent = (content) => !content || content.trim() === "" || content.trim() === "&nbsp;";
        this.blocksToHTML = (blocks) => blocks
            .map((block) => {
            var _a;
            if (this.isEmptyContent(block.content)) {
                return "";
            }
            const tagName = (_a = BLOCKS_SETTINGS[block.type]) === null || _a === void 0 ? void 0 : _a.tag;
            if (!tagName) {
                return "";
            }
            const attributes = block.attributes
                ? block.attributes
                    .split(";")
                    .map((attr) => attr.trim())
                    .filter((attr) => attr.length > 0)
                    .join(" ")
                : "";
            if (block.type === "image") {
                return `<img src="${block.content}" style="${block.styles}" class="${block.classes}" ${attributes}/>`;
            }
            else {
                return `<${tagName} style="${block.styles}" class="${block.classes}" ${attributes}>${block.content}</${tagName}>`;
            }
        })
            .join("");
        this.getBlockElementById = (blockId) => document.querySelector(`[data-typeblox-id="${blockId}"]`);
        this.getBlockElement = () => {
            const selection = window.getSelection();
            // Check if there's a valid selection and at least one range
            if (!selection || selection.rangeCount === 0)
                return null;
            const range = selection.getRangeAt(0);
            const selectedNode = range.startContainer;
            // Check if the selectedNode is an Element and use `closest`, or fall back to parentNode
            if (selectedNode instanceof Element) {
                return selectedNode.closest("[data-typeblox-id]");
            }
            else if (selectedNode.parentNode instanceof Element) {
                return selectedNode.parentNode.closest("[data-typeblox-id]");
            }
            return null;
        };
        this.focusBlock = (blockId, focusOnEnd = false) => {
            const newBlockElement = document.querySelector(`[data-typeblox-id="${blockId}"]`);
            if (newBlockElement) {
                newBlockElement.focus();
                const selection = window.getSelection();
                const range = document.createRange();
                if (focusOnEnd) {
                    // Move the cursor to the end of the block
                    range.selectNodeContents(newBlockElement);
                    range.collapse(false); // Collapse the range to the end
                }
                else {
                    // Move the cursor to the beginning of the block
                    range.selectNodeContents(newBlockElement);
                    range.collapse(true); // Collapse the range to the start
                }
                selection === null || selection === void 0 ? void 0 : selection.removeAllRanges(); // Clear existing selections
                selection === null || selection === void 0 ? void 0 : selection.addRange(range); // Add the new range
            }
        };
        this.focusElement = (element, focusOnEnd = false) => {
            if (element) {
                element.focus();
                const selection = window.getSelection();
                const range = document.createRange();
                if (focusOnEnd) {
                    // Move the cursor to the end of the block
                    range.selectNodeContents(element);
                    range.collapse(false); // Collapse the range to the end
                }
                else {
                    // Move the cursor to the beginning of the block
                    range.selectNodeContents(element);
                    range.collapse(true); // Collapse the range to the start
                }
                selection === null || selection === void 0 ? void 0 : selection.removeAllRanges(); // Clear existing selections
                selection === null || selection === void 0 ? void 0 : selection.addRange(range); // Add the new range
            }
        };
        this.parseHTMLToBlocks = (htmlString) => {
            var _a;
            if (!this.BloxManager) {
                console.warn(this, "BloxManager not initialized");
                return [];
            }
            // Parse the HTML string into a DOM Document
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, "text/html");
            // Generate a unique ID generator
            let idCounter = 1;
            const generateId = () => Date.now().toString() + (idCounter++).toString();
            // Map each top-level element to the desired structure
            const structure = Array.from(doc.body.children)
                .map((element) => {
                var _a, _b, _c, _d;
                const tagName = element.tagName.toLowerCase();
                // Find the corresponding block type in BLOCKS_SETTINGS
                const blockSetting = Object.values(BLOCKS_SETTINGS).find((setting) => setting.tag === tagName);
                if (blockSetting) {
                    // Create a specific block if blockSetting exists
                    return (_a = this.BloxManager) === null || _a === void 0 ? void 0 : _a.createBlox({
                        id: generateId(),
                        type: blockSetting.blockName,
                        content: tagName === "img" // Special case for images
                            ? element.getAttribute("src") || ""
                            : (_b = element.innerHTML) === null || _b === void 0 ? void 0 : _b.trim(),
                        style: element.getAttribute("style"),
                        classes: element.getAttribute("class"),
                        attributes: getAllowedAttributes(element),
                    });
                }
                // Create a default block when no blockSetting exists
                return (_c = this.BloxManager) === null || _c === void 0 ? void 0 : _c.createBlox({
                    id: generateId(),
                    type: BLOCK_TYPES.text,
                    content: (_d = element.innerHTML) === null || _d === void 0 ? void 0 : _d.trim(),
                });
            })
                .filter((block) => block != null);
            if (doc.body.children.length === 0) {
                const emptyBlock = (_a = this.BloxManager) === null || _a === void 0 ? void 0 : _a.createBlox({
                    id: generateId(),
                    type: BLOCK_TYPES.text,
                    content: htmlString.length ? htmlString : "",
                });
                if (emptyBlock)
                    return [emptyBlock];
            }
            return structure;
        };
        if (initialBloxManager) {
            this.BloxManager = initialBloxManager;
        }
    }
    setDependencies(BloxManager) {
        this.BloxManager = BloxManager;
    }
    splitElementBySelector(selector) {
        var _a, _b;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            throw new Error("No selection available in the current context.");
        }
        const range = selection.getRangeAt(0);
        const targetElement = (_a = (range.startContainer.nodeType === Node.ELEMENT_NODE
            ? range.startContainer
            : range.startContainer.parentElement)) === null || _a === void 0 ? void 0 : _a.closest(selector);
        if (!targetElement)
            return;
        const splitPoint = document.createElement("split-point");
        range.insertNode(splitPoint);
        const splitPointElement = targetElement.querySelector("split-point");
        if (!splitPointElement)
            return;
        const beforeRange = document.createRange();
        beforeRange.setStart(targetElement, 0);
        beforeRange.setEndBefore(splitPointElement);
        const beforeContent = beforeRange.cloneContents();
        const beforeContainer = document.createElement("div");
        beforeContainer.appendChild(beforeContent);
        const beforeHTML = beforeContainer.innerHTML.trim();
        const afterRange = document.createRange();
        afterRange.setStartAfter(splitPointElement);
        afterRange.setEnd(targetElement, targetElement.childNodes.length);
        const afterContent = afterRange.cloneContents();
        const afterContainer = document.createElement("div");
        afterContainer.appendChild(afterContent);
        const afterHTML = afterContainer.innerHTML.trim();
        splitPoint.remove();
        if (!beforeHTML && !afterHTML) {
            console.warn("Split aborted: No content before or after the caret.");
            return;
        }
        targetElement.innerHTML = beforeHTML;
        const newElement = document.createElement(targetElement.tagName.toLowerCase());
        newElement.innerHTML = afterHTML;
        (_b = targetElement.parentElement) === null || _b === void 0 ? void 0 : _b.insertBefore(newElement, targetElement.nextSibling);
        requestAnimationFrame(() => this.focusElement(newElement));
    }
    addElementAfter(selector) {
        var _a;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            throw new Error("No selection available in the current context.");
        }
        const range = selection.getRangeAt(0);
        const currentNode = range.commonAncestorContainer;
        const parentElement = (currentNode === null || currentNode === void 0 ? void 0 : currentNode.nodeType) === Node.ELEMENT_NODE
            ? currentNode.closest(selector)
            : (_a = currentNode === null || currentNode === void 0 ? void 0 : currentNode.parentElement) === null || _a === void 0 ? void 0 : _a.closest(selector);
        if (!parentElement) {
            throw new Error(`No element found matching the selector: ${selector}`);
        }
        const newElement = document.createElement(parentElement.tagName);
        parentElement.insertAdjacentElement("afterend", newElement);
        newElement.innerHTML = "\u00A0";
        requestAnimationFrame(() => this.focusElement(newElement));
        return newElement;
    }
}
