export class LinkManager {
    /**
     * Checks if an element is a YouTube iframe video
     * @param element The HTML element to check
     * @returns boolean indicating if the element is a YouTube iframe
     */
    isYouTubeIframeVideo(element) {
        if (element.tagName.toLowerCase() !== "iframe") {
            console.warn(`${element.tagName} is not iframe`);
            return false;
        }
        const src = element.src;
        return /youtube\.com\/embed\/|youtu\.be\//.test(src);
    }
    findClosestAnchor() {
        var _a;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return null;
        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;
        return commonAncestor.nodeType === Node.ELEMENT_NODE
            ? commonAncestor.closest("a")
            : ((_a = commonAncestor.parentElement) === null || _a === void 0 ? void 0 : _a.closest("a")) || null;
    }
    createLink(props) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return;
        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();
        if (!selectedText)
            return; // No text selected, exit.
        const existingAnchor = this.findClosestAnchor();
        if (existingAnchor) {
            // Update the existing link
            existingAnchor.href = props.href;
            existingAnchor.target = props.target;
        }
        else {
            // Wrap selection in a new <a> element
            const anchor = document.createElement("a");
            anchor.href = props.href;
            anchor.target = props.target;
            anchor.textContent = selectedText;
            range.deleteContents(); // Remove selected text
            range.insertNode(anchor); // Insert new link
            // Ensure selection remains inside the new link
            range.selectNode(anchor);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    /** Update existing link or create one if it doesn't exist */
    updateLink(props) {
        const anchor = this.findClosestAnchor();
        if (anchor) {
            anchor.href = props.href;
            anchor.target = props.target;
        }
        else {
            this.createLink(props);
        }
    }
    /** Remove link while keeping the text content */
    removeLink() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return;
        const anchor = this.findClosestAnchor();
        if (anchor) {
            // Replace <a> with plain text
            const textNode = document.createTextNode(anchor.textContent || "");
            anchor.replaceWith(textNode);
            // Update selection to highlight unlinked text
            const range = document.createRange();
            range.selectNodeContents(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    /** Get current selection link properties */
    getLinkProps() {
        const anchor = this.findClosestAnchor();
        return anchor
            ? {
                href: anchor.getAttribute("href") || "",
                target: anchor.getAttribute("target") || "_self",
            }
            : null;
    }
}
