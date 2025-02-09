import { BlockType } from "../types";
import { EventEmitter } from "./EventEmitter";
import { BLOCKS_SETTINGS, BLOCK_TYPES, EVENTS } from "../constants";
import { TypingManager } from "../managers/TypingManager";
import { StyleManager } from "../managers/StyleManager";
import { PasteManager } from "../managers/PasteManager";
import { convertToCamelCase } from "../utils/css";
import { DOMManager } from "../managers/DOMManager";
import { isEmpty } from "../utils/elements";
import { HistoryManager } from "../managers/HistoryManager";

interface BloxProps {
  id: string;
  content: string;
  type: BlockType;
  onUpdate: Function;
  TypingManager: TypingManager;
  StyleManager: StyleManager;
  PasteManager: PasteManager;
  HistoryManager: HistoryManager;
  DOMManager: DOMManager;
  style?: string | null;
  classes?: string | null;
  attributes?: string | null;
}

export class Blox extends EventEmitter {
  id: string;
  contentElement: HTMLElement | null;
  content: string;
  onUpdate: Function;
  type: BlockType;
  TypingManager: TypingManager;
  StyleManager: StyleManager;
  PasteManager: PasteManager;
  DOMManager: DOMManager;
  HistoryManager: HistoryManager;
  styles: string;
  classes: string;
  attributes: string;
  isSelected: boolean;

  constructor({
    onUpdate,
    id,
    type,
    content,
    TypingManager,
    StyleManager: FormatManager,
    HistoryManager,
    PasteManager,
    DOMManager,
    style,
    classes,
    attributes,
  }: BloxProps) {
    super();
    this.id = id ?? Date.now().toString();
    this.content = content;
    this.TypingManager = TypingManager;
    this.StyleManager = FormatManager;
    this.PasteManager = PasteManager;
    this.HistoryManager = HistoryManager;
    this.DOMManager = DOMManager;
    this.contentElement = this.getContentElement();
    this.onUpdate = onUpdate;
    this.type = type ?? "text";

    this.styles = style ?? "";
    this.classes = classes ?? "";
    this.attributes = attributes ?? "";
    this.isSelected = false;
  }

  getContentElement(): HTMLElement | null {
    return document.querySelector(`[data-typeblox-id="${this.id}"]`);
  }

  getImageURL(): string {
    return (
      document
        .querySelector(`[data-typeblox-id="${this.id}"] img`)
        ?.getAttribute("src") ?? ""
    );
  }

  public updateContent = () => {
    const liveElement = this.getContentElement();
    this.contentElement = liveElement;

    if (this.type === BLOCK_TYPES.image) {
      // Special handling for images
      const imageURL = this.getImageURL();
      const isSame = imageURL === this.content; // Compare the current content with the image URL
      this.content = isSame ? this.content : imageURL;
      return !isSame; // Return whether the content has changed
    }

    // Default handling for other types
    const isSame = liveElement?.innerHTML === this.content;
    this.content = isSame ? this.content : (liveElement?.innerHTML ?? "");
    return !isSame; // Return whether the content has changed
  };
  public getContent = () => {
    this.updateContent();
    return `<${BLOCKS_SETTINGS[this.type].tag}>${this.content}</${BLOCKS_SETTINGS[this.type].tag}>`;
  };

  public isContentEmpty = () => /^[\s\u00A0\u200B]*$/.test(this.content);

  public setContent = (contentString: string) => {
    if (this.type === BLOCK_TYPES.image) {
      // If it's an image, set `src` instead of `innerHTML`
      this.content = contentString; // Store the raw image URL
      if (this.contentElement instanceof HTMLImageElement) {
        this.contentElement.src = this.content;
      }
    } else {
      // For other block types, parse the HTML normally
      const parser = new DOMParser();
      const doc = parser.parseFromString(contentString, "text/html");
      const wrapperTag = BLOCKS_SETTINGS[this.type].tag;
      const wrapperElement = doc.body.querySelector(wrapperTag);

      this.content = wrapperElement ? wrapperElement.innerHTML : contentString;

      if (this.contentElement) {
        this.contentElement.innerHTML = this.content;
      }
    }

    this.sendUpdateBloxEvent();
  };

  private executeWithCallbacks<T>(callback: () => T): T {
    this.beforeToggle();
    const result = callback();
    this.afterToggle();
    return result;
  }

  private beforeToggle(): void {
    this.TypingManager.saveSelectionRange();
    this.TypingManager.restoreSelectionRange();
  }

  private afterToggle(): void {
    this.TypingManager.selectAllTextInSelectedElement();
    this.sendUpdateStyleEvent();
  }

  toggleBold(): boolean {
    return this.executeWithCallbacks(() => {
      const { isBold } = this.StyleManager.getStyle();
      if (document.queryCommandSupported("bold")) {
        document.execCommand("bold");
      } else {
        !isBold
          ? this.StyleManager.applyFormat("strong")
          : this.StyleManager.unapplyFormat("strong");
      }
      return !isBold;
    });
  }

  toggleItalic(): boolean {
    return this.executeWithCallbacks(() => {
      const { isItalic } = this.StyleManager.getStyle();
      if (document.queryCommandSupported("italic")) {
        document.execCommand("italic");
      } else {
        !isItalic
          ? this.StyleManager.applyFormat("i")
          : this.StyleManager.unapplyFormat("i");
      }
      return !isItalic;
    });
  }

  toggleStrike(): boolean {
    return this.executeWithCallbacks(() => {
      const { isStrikeout } = this.StyleManager.getStyle();
      if (document.queryCommandSupported("strikeThrough")) {
        document.execCommand("strikeThrough");
      } else {
        !isStrikeout
          ? this.StyleManager.applyFormat("s")
          : this.StyleManager.unapplyFormat("s");
      }
      return !isStrikeout;
    });
  }

  toggleUnderline(): boolean {
    return this.executeWithCallbacks(() => {
      const { isUnderline } = this.StyleManager.getStyle();
      if (document.queryCommandSupported("underline")) {
        document.execCommand("underline");
      } else {
        !isUnderline
          ? this.StyleManager.applyFormat("u")
          : this.StyleManager.unapplyFormat("u");
      }
      return !isUnderline;
    });
  }

  clearStyle(): void {
    return this.executeWithCallbacks(() => {
      if (document.queryCommandSupported("removeFormat")) {
        document.execCommand("removeFormat");
        console.warn("removeFormat");
      } else {
        this.StyleManager.clearFormat();
      }
    });
  }

  applyStyle(tagName: string, style: Record<string, string>): void {
    this.executeWithCallbacks(() => {
      this.StyleManager.applyFormat(tagName, style);
    });
  }

  toggleType(newType: BlockType): void {
    if (this.type === newType) return; // No change needed

    const wasList = this.isListType(this.type);
    this.type = newType;

    if (!wasList && this.isListType(newType)) {
      this.content = BLOCKS_SETTINGS[newType].contentPattern(this.content);
    }

    if (this.shouldClearContent(newType)) {
      this.content = newType === BLOCK_TYPES.code ? "\u200B" : "";
    }

    this.sendUpdateBloxEvent();

    requestAnimationFrame(() => {
      this.DOMManager?.focusElement(this.getContentElement());
    });
  }

  // Utility methods for better readability
  private isListType(type: BlockType): boolean {
    return (
      type === BLOCK_TYPES.numberedList || type === BLOCK_TYPES.bulletedList
    );
  }

  private shouldClearContent(type: BlockType): boolean {
    const contentElement = this.getContentElement();
    return (
      !contentElement ||
      isEmpty(contentElement) ||
      this.content.trim() === "/" ||
      type === BLOCK_TYPES.code ||
      type === BLOCK_TYPES.image
    );
  }

  pasteContent(e: ClipboardEvent) {
    this.PasteManager.pasteContent(e);
    this.sendUpdateBloxEvent();
  }

  // Getter for styles
  public getStyles(): Record<string, string> {
    const styleMap: Record<string, string> = {};
    this.styles
      .split(";")
      .map((style) => style.trim())
      .filter((style) => style.length > 0)
      .forEach((style) => {
        const [property, value] = style.split(":").map((s) => s.trim());
        if (property && value) {
          styleMap[convertToCamelCase(property)] = value;
        }
      });
    return styleMap;
  }

  // Setter for a single style
  public setStyle(property: string, value: string): void {
    const styles = this.getStyles();

    // Use raw property names for proper CSS handling
    const normalizedProperty = property.trim();
    styles[normalizedProperty] = value;

    // Convert styles back into a semicolon-separated string
    this.styles = Object.entries(styles)
      .map(([key, val]) => `${key}: ${val}`)
      .join("; ");

    this.sendUpdateBloxEvent();
  }

  // Setter for multiple styles
  public setStyles(styles: Record<string, string>): void {
    // Parse the existing styles into a Record
    const currentStyles = this.getStyles();

    // Merge the new styles into the current styles
    Object.entries(styles).forEach(([property, value]) => {
      const normalizedProperty = property.trim();
      currentStyles[normalizedProperty] = value;
    });

    // Convert the updated styles back to a string
    this.styles = Object.entries(currentStyles)
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ");

    this.sendUpdateBloxEvent();
  }

  // Remove a specific style
  public removeStyle(property: string): void {
    const styles = this.getStyles();
    delete styles[convertToCamelCase(property)];
    this.styles = Object.entries(styles)
      .map(([key, val]) => `${key}: ${val}`)
      .join("; ");
    this.sendUpdateBloxEvent();
  }

  // Clear all styles
  public clearStyles(): void {
    this.styles = "";
    this.sendUpdateBloxEvent();
  }

  // Getter for classes
  public getClasses(): string[] {
    return this.classes.split(" ").filter((cls) => cls.trim());
  }

  // Add a class
  public addClass(className: string): void {
    const classList = new Set(this.getClasses());
    classList.add(className);
    this.classes = Array.from(classList).join(" ");
    this.sendUpdateStyleEvent();
  }

  // Remove a class
  public removeClass(className: string): void {
    const classList = new Set(this.getClasses());
    classList.delete(className);
    this.classes = Array.from(classList).join(" ");
    this.sendUpdateStyleEvent();
  }

  // Check if a class exists
  public hasClass(className: string): boolean {
    return this.getClasses().includes(className);
  }

  // Clear all classes
  public clearClasses(): void {
    this.classes = "";
    this.sendUpdateStyleEvent();
  }

  // Toggle a style
  public toggleStyle(property: string, value: string): void {
    const styles = this.getStyles(); // Parse styles into a Record
    const camelCaseProperty = convertToCamelCase(property); // Convert property to camelCase

    if (styles[camelCaseProperty] === value) {
      // If the property has the given value, remove it
      this.removeStyle(property);
    } else {
      // Otherwise, set the property to the given value
      this.setStyle(property, value);
    }

    this.sendUpdateStyleEvent();
  }

  // Toggle a class
  public toggleClass(className: string): void {
    const classList = new Set(this.getClasses());
    if (classList.has(className)) {
      classList.delete(className);
    } else {
      classList.add(className);
    }
    this.classes = Array.from(classList).join(" ");
    this.sendUpdateStyleEvent();
  }

  // Getter for attributes
  public getAttributes(): Record<string, string> {
    const attributesMap: Record<string, string> = {};
    this.attributes
      .split(";")
      .map((attr) => attr.trim())
      .filter((attr) => attr.length > 0)
      .forEach((attr) => {
        const [key, value] = attr.split("=").map((s) => s.trim());
        if (key && value) {
          attributesMap[key] = value.replace(/^"|"$/g, ""); // Remove quotes around the value
        }
      });
    return attributesMap;
  }

  // Setter for a single attribute
  public setAttribute(attribute: string, value: string): void {
    const attributes = this.getAttributes();
    attributes[attribute.trim()] = value.trim();

    // Convert attributes back to a semicolon-separated string
    this.attributes = Object.entries(attributes)
      .map(([key, val]) => `${key}="${val}"`)
      .join("; ");

    this.sendUpdateBloxEvent();
  }

  // Setter for multiple attributes
  public setAttributes(attributes: Record<string, string>): void {
    const currentAttributes = this.getAttributes();

    // Merge new attributes into the existing ones
    Object.entries(attributes).forEach(([key, value]) => {
      currentAttributes[key.trim()] = value.trim();
    });

    // Convert the updated attributes back to a string
    this.attributes = Object.entries(currentAttributes)
      .map(([key, val]) => `${key}="${val}"`)
      .join("; ");

    this.sendUpdateBloxEvent();
  }

  // Remove a specific attribute
  public removeAttribute(attribute: string): void {
    const attributes = this.getAttributes();
    delete attributes[attribute.trim()];
    this.attributes = Object.entries(attributes)
      .map(([key, val]) => `${key}="${val}"`)
      .join("; ");
    this.sendUpdateBloxEvent();
  }

  // Clear all attributes
  public clearAttributes(): void {
    this.attributes = "";
    this.sendUpdateBloxEvent();
  }

  public setIsSelected(isSelected: boolean): void {
    this.isSelected = isSelected;
    this.sendUpdateBloxEvent();
  }

  sendUpdateStyleEvent(): void {
    this.updateContent();
    this.HistoryManager?.saveState();
    this.emit(EVENTS.styleChange);
  }

  sendUpdateBloxEvent(): void {
    this.emit(EVENTS.blocksChanged);
  }
}
