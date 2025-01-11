import { BLOCKS_SETTINGS } from "../constants";
export class DOMManager {
    constructor() {
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
                    // Replace disallowed tags with their inner content
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
        this.isEmptyContent = (content) => !content || content === "" || content === "&nbsp;";
        this.blocksToHTML = (blocks) => {
            return blocks
                .map((block) => {
                if (this.isEmptyContent(block.content))
                    return "";
                if (block.type === "image") {
                    return `<img src="${block.content}" />`;
                }
                else {
                    const tagName = BLOCKS_SETTINGS[block.type].tag;
                    return `<${tagName}>${block.content}</${tagName}>`;
                }
            })
                .join("");
        };
        this.getBlockElementById = (blockId) => {
            return document.querySelector(`[data-typeblox-id="${blockId}"]`);
        };
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
        this.focusBlock = (blockId, fucusOnEnd = false) => {
            const newBlockElement = document.querySelector(`[data-typeblox-id="${blockId}"]`);
            if (newBlockElement) {
                newBlockElement.focus();
                if (fucusOnEnd) {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(newBlockElement); // Select the entire contents
                    range.collapse(false); // Collapse the range to the end
                    selection === null || selection === void 0 ? void 0 : selection.removeAllRanges(); // Clear existing selections
                    selection === null || selection === void 0 ? void 0 : selection.addRange(range); // Add the new range
                }
            }
        };
    }
}
