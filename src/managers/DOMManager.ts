import { Blox } from "../classes/Blox";
import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../constants";
import type { BloxManager } from "./BloxManager";
import { getAllowedAttributes } from "../utils/attributes";

export class DOMManager {
  private BloxManager: BloxManager | null = null;

  constructor(initialBloxManager?: BloxManager) {
    if (initialBloxManager) {
      this.BloxManager = initialBloxManager;
    }
  }

  setDependencies(BloxManager: BloxManager) {
    this.BloxManager = BloxManager;
  }

  public removeElement = (matchingParent: Element): void => {
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

  public sanitizeHTML = (html: string): string => {
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
    const sanitizeNode = (node: Element) => {
      if (!allowedTags.includes(node.tagName.toLowerCase())) {
        // Remove disallowed tags and their content for specific tags
        if (["script", "style"].includes(node.tagName.toLowerCase())) {
          node.remove(); // Remove the entire tag
          return;
        }
        // Replace other disallowed tags with their inner content
        const parent = node.parentNode;
        while (node.firstChild) {
          parent?.insertBefore(node.firstChild, node);
        }
        parent?.removeChild(node);
      }
    };

    doc.body.querySelectorAll("*").forEach(sanitizeNode);

    return doc.body.innerHTML; // Return the sanitized HTML
  };

  private isEmptyContent = (content: string | null): boolean =>
    !content || content.trim() === "" || content.trim() === "&nbsp;";

  public blocksToHTML = (blocks: Blox[]) =>
    blocks
      .map((block) => {
        if (this.isEmptyContent(block.content)) {
          return "";
        }

        const tagName = BLOCKS_SETTINGS[block.type]?.tag;
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
        } else {
          return `<${tagName} style="${block.styles}" class="${block.classes}" ${attributes}>${block.content}</${tagName}>`;
        }
      })
      .join("");

  public getBlockElementById = (blockId: string): HTMLElement | null =>
    document.querySelector(`[data-typeblox-id="${blockId}"]`);

  public getBlockElement = (): HTMLElement | null => {
    const selection = window.getSelection();

    // Check if there's a valid selection and at least one range
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const selectedNode = range.startContainer;

    // Check if the selectedNode is an Element and use `closest`, or fall back to parentNode
    if (selectedNode instanceof Element) {
      return selectedNode.closest("[data-typeblox-id]");
    } else if (selectedNode.parentNode instanceof Element) {
      return selectedNode.parentNode.closest("[data-typeblox-id]");
    }

    return null;
  };

  public focusBlock = (blockId: string, focusOnEnd: boolean = false) => {
    const newBlockElement = document.querySelector(
      `[data-typeblox-id="${blockId}"]`,
    );
    if (newBlockElement) {
      (newBlockElement as HTMLElement).focus();

      const selection = window.getSelection();
      const range = document.createRange();

      if (focusOnEnd) {
        // Move the cursor to the end of the block
        range.selectNodeContents(newBlockElement);
        range.collapse(false); // Collapse the range to the end
      } else {
        // Move the cursor to the beginning of the block
        range.selectNodeContents(newBlockElement);
        range.collapse(true); // Collapse the range to the start
      }

      selection?.removeAllRanges(); // Clear existing selections
      selection?.addRange(range); // Add the new range
    }
  };

  public parseHTMLToBlocks = (htmlString: string): Blox[] => {
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
        const tagName = element.tagName.toLowerCase();

        // Find the corresponding block type in BLOCKS_SETTINGS
        const blockSetting = Object.values(BLOCKS_SETTINGS).find(
          (setting) => setting.tag === tagName,
        );

        if (blockSetting) {
          // Create a specific block if blockSetting exists
          return this.BloxManager?.createBlox({
            id: generateId(),
            type: blockSetting.blockName,
            content:
              tagName === "img" // Special case for images
                ? element.getAttribute("src") || ""
                : element.innerHTML?.trim(),
            style: element.getAttribute("style"),
            classes: element.getAttribute("class"),
            attributes: getAllowedAttributes(element as HTMLElement),
          });
        }

        // Create a default block when no blockSetting exists
        return this.BloxManager?.createBlox({
          id: generateId(),
          type: BLOCK_TYPES.text,
          content: element.innerHTML?.trim(),
        });
      })
      .filter((block): block is Blox => block != null);

    if (doc.body.children.length === 0) {
      const emptyBlock = this.BloxManager?.createBlox({
        id: generateId(),
        type: BLOCK_TYPES.text,
        content: htmlString.length ? htmlString : "",
      });
      if (emptyBlock) return [emptyBlock];
    }
    return structure;
  };
}
