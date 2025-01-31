interface LinkProps {
  href: string;
  target: string;
}

export class LinkManager {
  public findClosestAnchor(): HTMLAnchorElement | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;

    return commonAncestor.nodeType === Node.ELEMENT_NODE
      ? (commonAncestor as Element).closest("a")
      : commonAncestor.parentElement?.closest("a") || null;
  }

  public createLink(props: LinkProps): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    if (!selectedText) return; // No text selected, exit.

    const existingAnchor = this.findClosestAnchor();

    if (existingAnchor) {
      // Update the existing link
      existingAnchor.href = props.href;
      existingAnchor.target = props.target;
    } else {
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
  public updateLink(props: LinkProps): void {
    const anchor = this.findClosestAnchor();
    if (anchor) {
      anchor.href = props.href;
      anchor.target = props.target;
    } else {
      this.createLink(props);
    }
  }

  /** Remove link while keeping the text content */
  public removeLink(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

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
  public getLinkProps(): LinkProps | null {
    const anchor = this.findClosestAnchor();
    return anchor
      ? {
          href: anchor.getAttribute("href") || "",
          target: anchor.getAttribute("target") || "_self",
        }
      : null;
  }
}
