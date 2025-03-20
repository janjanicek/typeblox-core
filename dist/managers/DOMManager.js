import { Blox } from "../classes/Blox";
import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../blockTypes";
import { getAllowedAttributes } from "../utils/attributes";
export class DOMManager {
    constructor(initialBloxManager, initialTypingManager, initialEditorManager) {
        this.BloxManager = null;
        this.TypingManager = null;
        this.EditorManager = null;
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
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "code",
                "strong",
                "pre",
                "blockquote",
                "em",
                "s",
                "sub",
                "sup",
                "mark",
                "small",
                "del",
                "ins",
                "dfn",
                "kbd",
                "samp",
                "var",
                "hr",
                "cite",
                "abbr",
                "time",
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
            if (block.type === BLOCK_TYPES.image) {
                let styles = "";
                const alignment = block.getAttributes()["data-tbx-alignment"];
                if (alignment) {
                    switch (alignment) {
                        case "center":
                            styles = "text-align: center";
                            break;
                        case "right":
                            styles = "float: right";
                            break;
                        default:
                            break;
                    }
                }
                return `<p data-tbx-block="${BLOCK_TYPES.image}" style="${styles}" ><img src="${block.content}" style="${block.styles}" class="${block.classes}" ${attributes}/></p>`;
            }
            else if (block.type === BLOCK_TYPES.code) {
                return `<pre data-tbx-block="${BLOCK_TYPES.code}"><code style="${block.styles}" class="${block.classes}" ${attributes}>${block.content}</code></pre>`;
            }
            else {
                return `<${tagName} style="${block.styles}" class="${block.classes}" ${attributes}>${block.content}</${tagName}>`;
            }
        })
            .join("");
        this.getBlockElementById = (blockId) => document.querySelector(`[data-typeblox-id="${blockId}"]`);
        this.getBlockElement = () => {
            var _a, _b;
            const activeElement = document.activeElement;
            if (activeElement instanceof HTMLElement &&
                activeElement !== document.body &&
                ((_a = this.EditorManager) === null || _a === void 0 ? void 0 : _a.editorContainer) &&
                activeElement !==
                    document.querySelector((_b = this.EditorManager) === null || _b === void 0 ? void 0 : _b.editorContainer)) {
                if (activeElement.hasAttribute("data-typeblox-id")) {
                    return activeElement;
                }
                const nestedBlock = activeElement.querySelector("[data-typeblox-id]");
                if (nestedBlock instanceof HTMLElement) {
                    return nestedBlock;
                }
                const closedParent = activeElement.closest("[data-typeblox-id]");
                if (closedParent instanceof HTMLElement)
                    return closedParent;
            }
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
            var _a, _b, _c, _d, _e;
            if (!element)
                return;
            element.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            // Ensure the element contains at least one valid text node
            let targetNode = focusOnEnd
                ? ((_b = (_a = this.TypingManager) === null || _a === void 0 ? void 0 : _a.getLastMeaningfulNode(element)) !== null && _b !== void 0 ? _b : null)
                : ((_d = (_c = this.TypingManager) === null || _c === void 0 ? void 0 : _c.getFirstMeaningfulNode(element)) !== null && _d !== void 0 ? _d : null);
            if (!targetNode || targetNode.nodeType !== Node.TEXT_NODE) {
                console.warn("No valid text node found for selection. Adding one.");
                // If no meaningful text node exists, insert a zero-width space
                targetNode = document.createTextNode(""); // Zero-width space
                element.appendChild(targetNode);
            }
            const textLength = ((_e = targetNode.textContent) === null || _e === void 0 ? void 0 : _e.length) || 0;
            // Set cursor position inside the text node
            if (focusOnEnd) {
                range.setStart(targetNode, textLength);
                range.setEnd(targetNode, textLength);
            }
            else {
                range.setStart(targetNode, 0);
                range.setEnd(targetNode, 0);
            }
            selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
            selection === null || selection === void 0 ? void 0 : selection.addRange(range);
        };
        this.getCurrentDOM = () => {
            var _a, _b;
            const blocks = (_b = (_a = this.BloxManager) === null || _a === void 0 ? void 0 : _a.getBlox()) !== null && _b !== void 0 ? _b : [];
            const clonedBlocks = blocks === null || blocks === void 0 ? void 0 : blocks.map((block) => new Blox(Object.assign(Object.assign({}, block), { style: block.styles, classes: block.classes, attributes: block.attributes })));
            clonedBlocks === null || clonedBlocks === void 0 ? void 0 : clonedBlocks.forEach((block) => {
                block.updateContent(); // update the content and removeSelection if exist.
            });
            return this.blocksToHTML(clonedBlocks);
        };
        this.parseHTMLToBlocks = (htmlString) => {
            var _a;
            if (!this.BloxManager) {
                console.warn(this, "BloxManager not initialized");
                return [];
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, "text/html");
            let idCounter = 1;
            const generateId = () => `${Date.now()}${idCounter++}`;
            const blocks = Array.from(doc.body.children)
                .map((element) => {
                var _a, _b, _c;
                let predefinedBlockType = element.getAttribute("data-tbx-block") || "";
                const tagName = element.tagName.toLowerCase();
                if (tagName === "img")
                    predefinedBlockType = BLOCK_TYPES.image;
                const predefinedTag = (_a = BLOCKS_SETTINGS[predefinedBlockType]) === null || _a === void 0 ? void 0 : _a.tag;
                const type = predefinedTag || tagName;
                let finalElement = this.getFinalElement(element, predefinedTag) || element;
                const blockSetting = Object.values(BLOCKS_SETTINGS).find((setting) => setting.tag === type);
                return blockSetting
                    ? (_b = this.BloxManager) === null || _b === void 0 ? void 0 : _b.createBlox({
                        id: generateId(),
                        type: blockSetting.blockName,
                        content: predefinedBlockType === BLOCK_TYPES.image
                            ? finalElement.getAttribute("src") || ""
                            : finalElement.innerHTML.trim(),
                        style: finalElement.getAttribute("style"),
                        classes: finalElement.getAttribute("class"),
                        attributes: getAllowedAttributes(finalElement),
                    })
                    : (_c = this.BloxManager) === null || _c === void 0 ? void 0 : _c.createBlox({
                        id: generateId(),
                        type: BLOCK_TYPES.text,
                        content: finalElement.innerHTML.trim(),
                    });
            })
                .filter((block) => block != null && !block.isContentEmpty());
            if (doc.body.children.length === 0) {
                const emptyBlock = (_a = this.BloxManager) === null || _a === void 0 ? void 0 : _a.createBlox({
                    id: generateId(),
                    type: BLOCK_TYPES.text,
                    content: htmlString.trim() || "",
                });
                return emptyBlock ? [emptyBlock] : [];
            }
            return blocks;
        };
        this.getFinalElement = (container, tag) => { var _a; return (_a = container.querySelector(tag)) !== null && _a !== void 0 ? _a : container; };
        if (initialBloxManager) {
            this.BloxManager = initialBloxManager;
        }
        if (initialTypingManager) {
            this.TypingManager = initialTypingManager;
        }
        if (initialEditorManager) {
            this.EditorManager = initialEditorManager;
        }
    }
    setDependencies(BloxManager, TypingManager, EditorManager) {
        this.BloxManager = BloxManager;
        this.TypingManager = TypingManager;
        this.EditorManager = EditorManager;
    }
    getBlockFromEvent(event) {
        var _a, _b;
        const target = event.target;
        const blockElement = (target === null || target === void 0 ? void 0 : target.closest("[data-typeblox-id]")) ||
            (target === null || target === void 0 ? void 0 : target.querySelector("[data-typeblox-id]")) ||
            null;
        const blockId = (_a = blockElement === null || blockElement === void 0 ? void 0 : blockElement.dataset) === null || _a === void 0 ? void 0 : _a.typebloxId;
        if (!blockElement || !blockId)
            return null;
        return ((_b = this.BloxManager) === null || _b === void 0 ? void 0 : _b.getBlockById(blockId)) || null;
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
    addElement(selector, position = "after") {
        var _a;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            throw new Error("No selection available in the current context.");
        }
        const range = selection.getRangeAt(0);
        const currentNode = range.commonAncestorContainer;
        // Find the closest matching element based on the selector
        const parentElement = (currentNode === null || currentNode === void 0 ? void 0 : currentNode.nodeType) === Node.ELEMENT_NODE
            ? currentNode.closest(selector)
            : (_a = currentNode === null || currentNode === void 0 ? void 0 : currentNode.parentElement) === null || _a === void 0 ? void 0 : _a.closest(selector);
        if (!parentElement) {
            throw new Error(`No element found matching the selector: ${selector}`);
        }
        // Create the new element with the same tag as the parent
        const newElement = document.createElement(parentElement.tagName);
        // Insert the element before or after the matched parentElement
        if (position === "before") {
            parentElement.insertAdjacentElement("beforebegin", newElement);
        }
        else {
            parentElement.insertAdjacentElement("afterend", newElement);
        }
        // Ensure the new element receives focus
        requestAnimationFrame(() => this.focusElement(newElement));
        return newElement;
    }
    wrapElement(targetElement, wrapperTag) {
        if (!targetElement || !wrapperTag)
            return null;
        const wrapper = document.createElement(wrapperTag);
        targetElement.replaceWith(wrapper); // Replace target with the new wrapper
        wrapper.appendChild(targetElement); // Move target inside the wrapper
        return wrapper;
    }
}
