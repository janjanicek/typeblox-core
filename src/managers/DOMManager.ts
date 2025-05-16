import { Blox } from "../classes/Blox";
import { EVENTS } from "../constants";
import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../blockTypes";
import type { BloxManager } from "./BloxManager";
import { getAllowedAttributes } from "../utils/attributes";
import { TypingManager } from "./TypingManager";
import { BlockType, JSONNode } from "../types";
import { EditorManager } from "./EditorManager";
import { LinkManager } from "./LinkManager";

export class DOMManager {
  private BloxManager: BloxManager | null = null;
  private TypingManager: TypingManager | null = null;
  private EditorManager: EditorManager | null = null;
  private LinkManager: LinkManager | null = null;

  constructor(
    initialBloxManager?: BloxManager,
    initialTypingManager?: TypingManager,
    initialEditorManager?: EditorManager,
    initialLinkManager?: LinkManager,
  ) {
    if (initialBloxManager) {
      this.BloxManager = initialBloxManager;
    }
    if (initialTypingManager) {
      this.TypingManager = initialTypingManager;
    }
    if (initialEditorManager) {
      this.EditorManager = initialEditorManager;
    }
    if (initialLinkManager) {
      this.LinkManager = initialLinkManager;
    }
  }

  setDependencies(
    BloxManager: BloxManager,
    TypingManager: TypingManager,
    EditorManager: EditorManager,
    LinkManager: LinkManager,
  ) {
    this.BloxManager = BloxManager;
    this.TypingManager = TypingManager;
    this.EditorManager = EditorManager;
    this.LinkManager = LinkManager;
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

  private isEmptyContent = (block: Blox | null): boolean => {
    if (!block) return true;

    if (block.type === BLOCK_TYPES.columns) {
      return block.columns.every((column) =>
        column.blox.every((child) => this.isEmptyContent(child)),
      );
    }
    const txt = block.content?.trim() ?? "";
    return txt === "" || txt === "&nbsp;";
  };

  public blocksToHTML = (blocks: Blox[]): string =>
    blocks
      .map((block) => {
        if (this.isEmptyContent(block)) {
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

        if (block.type === BLOCK_TYPES.image) {
          let styles = "";
          const alignment = block.getAttributes()["data-tbx-alignment"];
          if (alignment === "center") styles = "text-align: center";
          else if (alignment === "right") styles = "float: right";

          return `<p data-tbx-block="${block.type}" style="${styles}"><${tagName} src="${block.content}" style="${block.styles}" class="${block.classes}" ${attributes}/></p>`;
        }

        if (block.type === BLOCK_TYPES.video) {
          let styles = "";
          const alignment = block.getAttributes()["data-tbx-alignment"];
          if (alignment === "center") styles = "text-align: center";
          else if (alignment === "right") styles = "float: right";

          const width = block.getAttributes()["width"] || 560;
          const height = block.getAttributes()["height"] || 315;
          return `<p data-tbx-block="${block.type}" style="${styles}"><iframe src="${block.content}" style="${block.styles}" class="${block.classes}" width="${width}" height="${height}" ${attributes}></iframe></p>`;
        }

        if (block.type === BLOCK_TYPES.code) {
          return `<pre data-tbx-block="${BLOCK_TYPES.code}"><code style="${block.styles}" class="${block.classes}" ${attributes}>${block.content}</code></pre>`;
        }

        if (block.type === BLOCK_TYPES.columns) {
          const hasContent = block.columns.some((col) =>
            col.blox.some((child) => !this.isEmptyContent(child)),
          );
          if (!hasContent) return "";

          const wrapperAttrs = [
            `data-tbx-block="${block.type}"`,
            block.styles && `style="${block.styles}"`,
            block.classes && `class="${block.classes}"`,
            attributes,
          ]
            .filter(Boolean)
            .join(" ");

          // Render each column’s children recursively
          const colsHTML = block.columns
            .map(
              (col) =>
                `<div class="tbx-column" style="flex: 1;">${this.blocksToHTML(col.blox)}</div>`,
            )
            .join("");

          return `<div ${wrapperAttrs}><div class="tbx-columns" style="display: flex; gap: 1em;">${colsHTML}</div></div>`;
        }
        return `<${tagName} style="${block.styles}" class="${block.classes}" ${attributes}>${block.content}</${tagName}>`;
      })
      .join("");

  public getBlockElementById = (blockId: string): HTMLElement | null =>
    document.querySelector(`[data-typeblox-id="${blockId}"]`);

  public getBlockElement = (): HTMLElement | null => {
    const activeElement = document.activeElement;
    const parentBlockElement =
      activeElement?.getAttribute("role") !== "button"
        ? activeElement?.closest(".tbx-block")
        : activeElement;
    const isEditorContainer = (activeElement: HTMLElement) =>
      this.EditorManager?.editorContainer
        ? activeElement ===
          document.querySelector(this.EditorManager?.editorContainer)
        : false;
    if (
      parentBlockElement &&
      activeElement instanceof HTMLElement &&
      activeElement !== document.body &&
      !isEditorContainer(activeElement)
    ) {
      if (activeElement.hasAttribute("data-typeblox-id")) {
        return activeElement;
      }
      const nestedBlock =
        parentBlockElement.querySelector("[data-typeblox-id]");
      if (nestedBlock instanceof HTMLElement) {
        return nestedBlock;
      }
      const closedParent = parentBlockElement.closest("[data-typeblox-id]");
      if (closedParent instanceof HTMLElement) {
        return closedParent;
      }
    }

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

  public getBlockFromEvent(event: Event): Blox | null {
    const target = event.target as HTMLElement;
    const blockElement =
      target?.closest("[data-typeblox-id]") ||
      target?.querySelector("[data-typeblox-id]") ||
      null;
    const blockId = (blockElement as HTMLElement)?.dataset?.typebloxId;
    if (!blockElement || !blockId) return null;
    return this.BloxManager?.getBlockById(blockId) || null;
  }

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

  public focusElement = (
    element: HTMLElement | null,
    focusOnEnd: boolean = false,
  ) => {
    if (!element) return;

    element.focus();

    const selection = window.getSelection();
    const range = document.createRange();

    // Ensure the element contains at least one valid text node
    let targetNode: Node | null = focusOnEnd
      ? (this.TypingManager?.getLastMeaningfulNode(element) ?? null)
      : (this.TypingManager?.getFirstMeaningfulNode(element) ?? null);

    if (!targetNode || targetNode.nodeType !== Node.TEXT_NODE) {
      console.warn("No valid text node found for selection. Adding one.");

      // If no meaningful text node exists, insert a zero-width space
      targetNode = document.createTextNode(""); // Zero-width space
      element.appendChild(targetNode);
    }

    const textLength = targetNode.textContent?.length || 0;

    // Set cursor position inside the text node
    if (focusOnEnd) {
      range.setStart(targetNode, textLength);
      range.setEnd(targetNode, textLength);
    } else {
      range.setStart(targetNode, 0);
      range.setEnd(targetNode, 0);
    }

    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  public getCurrentDOM = (): string => {
    const blocks = this.BloxManager?.getBlox() ?? [];
    const clonedBlocks = blocks?.map(
      (block) =>
        new Blox({
          ...block,
          style: block.styles,
          classes: block.classes,
          attributes: block.attributes,
          columns: block.columns,
        }),
    );

    clonedBlocks?.forEach((block) => {
      block.updateContent(); // update the content and removeSelection if exist.
    });

    return this.blocksToHTML(clonedBlocks);
  };

  public parseHTMLToBlocks = (htmlString: string): Blox[] => {
    if (!this.BloxManager) {
      console.warn(this, "BloxManager not initialized");
      return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    let idCounter = 1;
    const generateId = () => `${Date.now()}${idCounter++}`;

    const parseElements = (elements: HTMLCollection | Element[]): Blox[] => {
      return Array.from(elements)
        .map((element) => {
          // detect block-type override
          let predefinedBlockType =
            element.getAttribute("data-tbx-block") || "";
          const tagName = element.tagName.toLowerCase();

          if (tagName === "img") predefinedBlockType = BLOCK_TYPES.image;
          if (
            tagName === "iframe" &&
            this.LinkManager &&
            this.LinkManager.isYouTubeIframeVideo(element as HTMLElement)
          ) {
            predefinedBlockType = BLOCK_TYPES.video;
          }

          if (predefinedBlockType === BLOCK_TYPES.columns) {
            const columnsContainer = element.querySelector(".tbx-columns");

            if (columnsContainer) {
              const colDivs = Array.from(columnsContainer.children).filter(
                (child) => child.classList.contains("tbx-column"),
              );

              const columnBlock = this.BloxManager!.createBlox({
                id: generateId(),
                type: BLOCK_TYPES.columns,
                content: "",
              })!;

              columnBlock.columns = colDivs.map((colDiv) => {
                const childBlocks = parseElements(colDiv.children);

                if (childBlocks.length === 0) {
                  const empty = this.BloxManager!.createBlox({
                    id: generateId(),
                    type: BLOCK_TYPES.text,
                    content: "",
                  })!;
                  return { blox: [empty] };
                }

                return { blox: childBlocks };
              });

              return columnBlock;
            }
          }

          // fallback to "normal" block
          const predefinedTag =
            BLOCKS_SETTINGS[predefinedBlockType as BlockType]?.tag;
          const type = predefinedTag || tagName;

          // figure out which element actually holds the final content
          const finalElement =
            this.getFinalElement(
              element as HTMLElement,
              predefinedTag as BlockType,
            ) || element;

          const setting = Object.values(BLOCKS_SETTINGS).find(
            (s) => s.tag === type,
          );

          if (setting) {
            return this.BloxManager!.createBlox({
              id: generateId(),
              type: setting.blockName,
              content:
                setting.blockName === BLOCK_TYPES.image
                  ? finalElement.getAttribute("src") || ""
                  : setting.blockName === BLOCK_TYPES.video
                    ? finalElement.getAttribute("src") || ""
                    : finalElement.innerHTML.trim(),
              style: finalElement.getAttribute("style"),
              classes: finalElement.getAttribute("class"),
              attributes: getAllowedAttributes(finalElement as HTMLElement),
            });
          } else {
            // unknown tag → treat as text
            return this.BloxManager!.createBlox({
              id: generateId(),
              type: BLOCK_TYPES.text,
              content: finalElement.innerHTML.trim(),
            });
          }
        })
        .filter(
          (block): block is Blox => block != null && !block.isContentEmpty(),
        );
    };

    const topLevel = doc.body.children;
    const blocks = parseElements(topLevel);

    if (blocks.length === 0) {
      const emptyBlock = this.BloxManager?.createBlox({
        id: generateId(),
        type: BLOCK_TYPES.text,
        content: htmlString.trim() || "",
      });
      return emptyBlock ? [emptyBlock] : [];
    }

    return blocks;
  };

  private getFinalElement = (
    container: HTMLElement,
    tag: string,
  ): HTMLElement | null => container.querySelector(tag) ?? container;

  public splitElementBySelector(selector: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      throw new Error("No selection available in the current context.");
    }

    const range = selection.getRangeAt(0);
    const targetElement = (
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as Element)
        : range.startContainer.parentElement
    )?.closest(selector) as HTMLElement;
    if (!targetElement) return;

    const splitPoint = document.createElement("split-point");
    range.insertNode(splitPoint);

    const splitPointElement = targetElement.querySelector("split-point");
    if (!splitPointElement) return;

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
    const newElement = document.createElement(
      targetElement.tagName.toLowerCase(),
    );
    newElement.innerHTML = afterHTML;

    targetElement.parentElement?.insertBefore(
      newElement,
      targetElement.nextSibling,
    );

    requestAnimationFrame(() => this.focusElement(newElement));
  }

  public addElement(
    selector: string,
    position: "before" | "after" = "after",
  ): HTMLElement {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      throw new Error("No selection available in the current context.");
    }

    const range = selection.getRangeAt(0);
    const currentNode = range.commonAncestorContainer;

    // Find the closest matching element based on the selector
    const parentElement =
      currentNode?.nodeType === Node.ELEMENT_NODE
        ? (currentNode as Element).closest(selector)
        : currentNode?.parentElement?.closest(selector);

    if (!parentElement) {
      throw new Error(`No element found matching the selector: ${selector}`);
    }

    // Create the new element with the same tag as the parent
    const newElement = document.createElement(parentElement.tagName);

    // Insert the element before or after the matched parentElement
    if (position === "before") {
      parentElement.insertAdjacentElement("beforebegin", newElement);
    } else {
      parentElement.insertAdjacentElement("afterend", newElement);
    }

    // Ensure the new element receives focus
    requestAnimationFrame(() => this.focusElement(newElement));

    return newElement;
  }

  public wrapElement(
    targetElement: HTMLElement,
    wrapperTag: string,
  ): HTMLElement | null {
    if (!targetElement || !wrapperTag) return null;

    const wrapper = document.createElement(wrapperTag);
    targetElement.replaceWith(wrapper); // Replace target with the new wrapper
    wrapper.appendChild(targetElement); // Move target inside the wrapper

    return wrapper;
  }
}
