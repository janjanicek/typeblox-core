import type { TypingManager } from "./TypingManager";
import { AVAILABLE_FONTS, EVENTS, DEFAULT_STYLES } from "../constants";
import { detectedStyles } from "../types";
import { toCssStyle } from "../utils/css";
import { DOMManager } from "./DOMManager";
import { EventEmitter } from "../classes/EventEmitter";
import type { Blox } from "../classes/Blox";
import { LinkManager } from "./LinkManager";

export class StyleManager extends EventEmitter {
  private TypingManager: TypingManager | null = null;

  private DOMManager: DOMManager | null = null;

  private LinkManager: LinkManager | null = null;

  private currentStyles: detectedStyles = {
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

  constructor() {
    super();
    this.currentStyles = this.getStyle();
  }

  setDependencies(
    DOMManager: DOMManager,
    TypingManager: TypingManager,
    LinkManager: LinkManager,
  ) {
    this.DOMManager = DOMManager;
    this.TypingManager = TypingManager;
    this.LinkManager = LinkManager;
  }

  private areDependenciesSet = () => this.TypingManager && this.DOMManager;

  /**
   * Applies formatting to the selected text.
   * This method handles various scenarios including:
   * - Applying formatting to a text selection
   * - Handling nested formatting
   * - Applying styles to existing formatted elements
   * - Handling complex DOM structures
   *
   * @param tagName - The HTML tag to apply (e.g., 'strong', 'em', 'u')
   * @param style - Optional styles to apply to the element
   * @returns boolean - Whether the formatting was applied successfully
   */
  public applyFormat(tagName: string, style?: Record<string, string>): boolean {
    if (!this.areDependenciesSet()) return false;

    const contentElement = this.DOMManager?.getBlockElement();
    if (!contentElement) return false;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText.trim()) return false; // No meaningful selection

    const selectedElement = this.TypingManager?.getSelectedElement();
    if (!selectedElement) return false;

    // Save selection state for later restoration
    this.TypingManager?.saveSelection();

    try {
      const targetElement =
        selectedElement.nodeType === Node.TEXT_NODE
          ? selectedElement.parentElement
          : (selectedElement as HTMLElement);

      if (!targetElement) return false;

      let matchingParentTag = targetElement.closest(tagName);
      let matchingParentStyle: HTMLElement | null = null;

      // If style is provided, check if an element with the same style exists
      if (style && Object.keys(style).length > 0) {
        const leadingStyle = Object.keys(style)[0];
        const styleKey = toCssStyle(leadingStyle);
        matchingParentStyle = targetElement.closest<HTMLElement>(
          `${tagName}[style*="${styleKey}"]`,
        );

        // If we found a matching parent with the same style and it contains exactly our selection,
        // just update its styles instead of creating a new element
        if (
          matchingParentStyle &&
          matchingParentStyle.textContent?.trim() ===
            targetElement?.textContent?.trim()
        ) {
          Object.keys(style).forEach((key) => {
            matchingParentStyle!.style[key as any] = style[key];
          });

          // Restore selection after applying style
          this.TypingManager?.restoreSelection();
          return true;
        }
      } else if (matchingParentTag) {
        // If we already have this tag applied to the exact selection, don't apply it again
        if (matchingParentTag.textContent?.trim() === selectedText.trim()) {
          // Restore selection and return
          this.TypingManager?.restoreSelection();
          return false;
        }
      }

      // Handle partial text selection by splitting text nodes
      if (selectedElement.nodeType === Node.TEXT_NODE) {
        const textNode = selectedElement;
        const textContent = textNode.textContent!;
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;

        const beforeText = textContent.slice(0, startOffset);
        const selectedPart = textContent.slice(startOffset, endOffset);
        const afterText = textContent.slice(endOffset);

        const wrapper = document.createElement(tagName);
        wrapper.textContent = selectedPart;

        if (style) {
          Object.keys(style).forEach((key) => {
            wrapper.style[key as any] = style[key];
          });
        }

        const parentElement = textNode.parentElement!;

        if (beforeText) {
          const beforeNode = document.createTextNode(beforeText);
          parentElement.insertBefore(beforeNode, textNode);
        }

        parentElement.insertBefore(wrapper, textNode);

        if (afterText) {
          const afterNode = document.createTextNode(afterText);
          parentElement.insertBefore(afterNode, textNode);
        }

        textNode.remove();

        // Try to merge adjacent identical elements
        if (parentElement) {
          this.TypingManager?.mergeConsecutiveStyledElements(parentElement);
        }
      } else {
        // If not a text node, wrap the entire selection
        try {
          const wrapper = document.createElement(tagName);
          if (style) {
            Object.keys(style).forEach((key: any) => {
              wrapper.style[key] = style[key];
            });
          }

          // Try to use surroundContents, but it can fail if the selection spans multiple elements
          try {
            range.surroundContents(wrapper);
          } catch (e) {
            // Fallback for complex selections that span multiple elements
            console.warn(
              "surroundContents failed, using extractContents fallback",
            );
            const fragment = range.extractContents();
            wrapper.appendChild(fragment);
            range.insertNode(wrapper);
          }

          // Try to merge adjacent identical elements
          if (wrapper.parentElement) {
            this.TypingManager?.mergeConsecutiveStyledElements(
              wrapper.parentElement,
            );
          }
        } catch (error) {
          console.error("Error applying format:", error);
          // Restore selection even if there was an error
          this.TypingManager?.restoreSelection();
          return false;
        }
      }

      // Restore selection after applying style
      this.TypingManager?.restoreSelection();
      return true;
    } catch (error) {
      console.error("Error in applyFormat:", error);
      // Try to restore selection even if there was an error
      this.TypingManager?.restoreSelection();
      return false;
    }
  }

  /**
   * Removes formatting from the selected text.
   * This method handles various scenarios including:
   * - Removing formatting from a text selection
   * - Handling nested formatting
   * - Removing styles from formatted elements
   *
   * @param tagName - The HTML tag to remove (e.g., 'strong', 'em', 'u')
   * @param styleKey - Optional style property to remove
   * @returns boolean - Whether the formatting was removed successfully
   */
  public unapplyFormat(
    tagName: string,
    styleKey: string | null = null,
  ): boolean {
    if (!this.areDependenciesSet()) return false;

    let selectedElement = this.TypingManager?.getSelectedElement();
    if (!selectedElement) return false;

    // Save selection state for later restoration
    this.TypingManager?.saveSelection();

    try {
      // Ensure selectedElement is an HTMLElement before calling .closest()
      const targetElement =
        selectedElement.nodeType === Node.TEXT_NODE
          ? selectedElement.parentElement
          : (selectedElement as HTMLElement);

      if (!targetElement) {
        this.TypingManager?.restoreSelection();
        return false;
      }

      const matchingParent = targetElement.closest(tagName);
      const isMatchingSelection =
        targetElement.textContent?.trim() ===
        matchingParent?.textContent?.trim();
      const matchingChildren = targetElement.querySelectorAll(tagName);

      // Remove nested tags first
      if (matchingChildren.length > 0) {
        Array.from(matchingChildren).forEach((element) => {
          this.DOMManager?.removeElement(element);
        });
      }

      // If the whole selection is wrapped in the tag, remove it
      if (matchingParent && isMatchingSelection) {
        this.DOMManager?.removeElement(matchingParent);
      }

      // Handle inline styles removal
      if (styleKey) {
        const closestStyledElement =
          targetElement.closest<HTMLElement>(tagName);
        if (
          closestStyledElement &&
          closestStyledElement.style[styleKey as any]
        ) {
          closestStyledElement.style.removeProperty(styleKey);
        }
      }

      this.unapplyAliases(tagName);

      // Restore selection after removing formatting
      this.TypingManager?.restoreSelection();
      return true;
    } catch (error) {
      console.error("Error in unapplyFormat:", error);
      // Try to restore selection even if there was an error
      this.TypingManager?.restoreSelection();
      return false;
    }
  }

  unapplyAliases(tagName: string) {
    if (tagName === "strong") {
      this.unapplyFormat("b");
      this.unapplyFormat("bold");
    }
    if (tagName === "i") {
      this.unapplyFormat("em");
    }
  }

  getStyle = (): detectedStyles => {
    const selection = this.TypingManager?.getSelectedElement();

    let currentNode: HTMLElement | null = null;

    // If selection is a text node, move to its parent element
    if (selection) {
      if (selection.nodeType === Node.TEXT_NODE) {
        currentNode = selection.parentElement;
      } else {
        currentNode = selection as HTMLElement;
      }
    }

    if (!currentNode) {
      currentNode = this.TypingManager?.getCursorElement() as HTMLElement;
    }

    if (currentNode) {
      // Default styles
      const detectedStyles: detectedStyles = {
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

      const detectStylesOnNode = (node: HTMLElement) => {
        const computedStyle = window.getComputedStyle(node);
        const blockType = node.closest("[data-typeblox-id]")?.nodeName;

        if (blockType) {
          switch (blockType) {
            case "H1":
              detectedStyles.isH1 = true;
              break;
            case "H2":
              detectedStyles.isH2 = true;
              break;
            case "H3":
              detectedStyles.isH3 = true;
              break;
            case "P":
              detectedStyles.isParagraph = true;
              break;
            case "CODE":
              detectedStyles.isCode = true;
              break;
          }
        }

        if (
          !detectedStyles.isBold &&
          (computedStyle.fontWeight === "bold" ||
            parseInt(computedStyle.fontWeight) >= 700 ||
            node.matches("b,strong"))
        ) {
          detectedStyles.isBold = true;
        }

        if (
          !detectedStyles.isItalic &&
          (computedStyle.fontStyle === "italic" || node.matches("i,em"))
        ) {
          detectedStyles.isItalic = true;
        }

        if (
          !detectedStyles.isUnderline &&
          (computedStyle.textDecoration.includes("underline") ||
            node.matches("u"))
        ) {
          detectedStyles.isUnderline = true;
        }

        if (
          !detectedStyles.isStrikeout &&
          (computedStyle.textDecoration.includes("line-through") ||
            node.matches("s,strike"))
        ) {
          detectedStyles.isStrikeout = true;
        }

        // Detect color
        if (!detectedStyles.color) {
          detectedStyles.color = computedStyle.color || null;
        }

        // Detect background color
        if (
          !detectedStyles.backgroundColor &&
          computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
        ) {
          detectedStyles.backgroundColor = computedStyle.backgroundColor;
        }

        // Detect font-family
        if (!detectedStyles.fontFamily) {
          const cleanFont = computedStyle.fontFamily.replace(/^"|"$/g, "");
          if (
            cleanFont &&
            AVAILABLE_FONTS.map((f) => f.toLowerCase()).includes(
              cleanFont.toLowerCase(),
            )
          ) {
            detectedStyles.fontFamily = cleanFont;
          } else {
            detectedStyles.fontFamily = "Arial";
          }
        }

        // Detect text alignment
        if (!detectedStyles.textAlign) {
          detectedStyles.textAlign = computedStyle.textAlign;
        }

        // Detect if it's a link
        if (!detectedStyles.isLink) {
          detectedStyles.isLink =
            this.LinkManager?.findClosestAnchor() !== null || false;
        }
      };

      // Traverse up from the text node
      while (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
        if (currentNode.matches("[data-typeblox-id]")) {
          break;
        }

        detectStylesOnNode(currentNode);
        currentNode = currentNode.parentElement!;
      }

      return detectedStyles;
    }

    // Return default styles if no valid selection is found
    return DEFAULT_STYLES;
  };

  clearFormat = (element?: HTMLElement) => {
    if (!this.areDependenciesSet()) return;
    const selection = this.TypingManager?.getSelectedElement();
    const cursorElement = this.TypingManager?.getCursorElement();

    let targetElement = element || selection || cursorElement;

    if (!targetElement) {
      console.warn(
        "No selected or cursor element found for clearing formatting.",
      );
      return;
    }

    // Ensure targetElement is the block element itself, not a child text node
    if (targetElement.nodeType === Node.TEXT_NODE) {
      targetElement = targetElement.parentElement as HTMLElement;
    }

    // If a full block element (h1, p, li, etc.) is selected, clean only its children
    const isFullBlockSelected = (element: HTMLElement): boolean => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      const range = selection.getRangeAt(0);

      while (
        element.parentElement &&
        !element.matches("[data-typeblox-editor]")
      ) {
        if (element.textContent?.trim() !== range.toString().trim()) {
          return false; // If parent has more content than the selection, it's a partial selection
        }
        element = element.parentElement;
      }
      return true; // If we reach the block and all content matches the selection, full block is selected
    };

    const removeFormatting = (element: Node): void => {
      if (element.nodeType === Node.ELEMENT_NODE) {
        const parent = element.parentNode as HTMLElement | null;

        // Process children first (recursive)
        Array.from(element.childNodes).forEach((child) =>
          removeFormatting(child),
        );

        // Remove inline formatting tags while keeping content
        if (
          [
            "B",
            "I",
            "U",
            "S",
            "STRONG",
            "EM",
            "MARK",
            "SPAN",
            "STRIKE",
          ].includes(element.nodeName)
        ) {
          while (element.firstChild) {
            parent?.insertBefore(element.firstChild, element);
          }
          parent?.removeChild(element);
        } else if ((element as HTMLElement).style) {
          (element as HTMLElement).removeAttribute("style");
        }
      }
    };

    const mergeTextNodes = (element: Node): void => {
      let child = element.firstChild;
      while (child) {
        if (
          child.nodeType === Node.TEXT_NODE &&
          child.nextSibling?.nodeType === Node.TEXT_NODE
        ) {
          if (!child.textContent) child.textContent = "";
          child.textContent += child.nextSibling.textContent;
          child.parentNode?.removeChild(child.nextSibling);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          mergeTextNodes(child);
        }
        child = child.nextSibling;
      }
    };

    if (isFullBlockSelected(targetElement as HTMLElement)) {
      // Expand target to the full block
      targetElement = (targetElement as HTMLElement).closest(
        "[data-typeblox-editor]",
      ) as HTMLElement;
      Array.from(targetElement.childNodes).forEach(removeFormatting);
    } else {
      // Otherwise, wrap selection and remove formatting inside
      const wrapSelection = (): HTMLElement | null => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);

        // Ensure the selection is not empty
        if (range.collapsed) return null;

        const span = document.createElement("span");
        span.setAttribute("data-temp-wrap", "true");

        try {
          // Attempt to wrap selection normally
          range.surroundContents(span);
        } catch (error) {
          console.warn("surroundContents failed, applying fallback.", error);

          // Fallback: If selection spans multiple elements, extract and reinsert
          const fragment = range.extractContents();

          if (!fragment.childNodes.length) {
            console.warn("Extracted fragment is empty, aborting wrap.");
            return null;
          }

          span.appendChild(fragment);

          // Insert the wrapped content back into the document
          range.insertNode(span);

          // Expand selection to include the new span
          range.selectNode(span);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        return span;
      };

      let tempWrap = wrapSelection();

      if (tempWrap) {
        removeFormatting(tempWrap);
        const parent = tempWrap.parentNode;
        while (tempWrap.firstChild) {
          parent?.insertBefore(tempWrap.firstChild, tempWrap);
        }
        parent?.removeChild(tempWrap);
      }
    }

    mergeTextNodes(targetElement);
  };

  public updateCurrentStyles(block: Blox): void {
    const detectedStyles = this.getStyle();

    // Update `currentStyles` with the detected styles
    this.currentStyles = {
      ...this.currentStyles, // Retain other styles
      ...detectedStyles, // Update with the new styles from the block
    };

    // Optionally, emit a high-level styleChange event for external listeners
    this.emit(EVENTS.styleChange, block);
  }
}
