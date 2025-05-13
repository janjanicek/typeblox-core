import { BlockType, EventCallback, JSONNode } from "../types";
import { EventEmitter } from "./EventEmitter";
import { EVENTS } from "../constants";
import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../blockTypes";
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
  columns?: Column[] | null;
}

interface Column {
  blox: Blox[];
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
  _listeners?: Record<string, EventCallback>;
  columns: Column[] = []; // Initialize the subBlocks array

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
    columns,
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
    this.columns = columns ?? [];

    const defaultStyles = BLOCKS_SETTINGS[this.type].defaults.styles ?? "";
    const defaultClasses = BLOCKS_SETTINGS[this.type].defaults.classes ?? "";
    const defaultAttributes =
      BLOCKS_SETTINGS[this.type].defaults.attributes ?? "";

    this.styles = style ? `${style} ${defaultStyles}` : defaultStyles;
    this.classes = classes ? `${classes} ${defaultClasses}` : defaultClasses;
    this.attributes = attributes
      ? `${attributes} ${defaultAttributes}`
      : defaultAttributes;
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

  getVideoURL(): string {
    return (
      document
        .querySelector(`[data-typeblox-id="${this.id}"] iframe`)
        ?.getAttribute("src") ?? ""
    );
  }

  public updateContent = () => {
    const liveElement = this.getContentElement();
    const clonedElement = liveElement?.cloneNode(true) as HTMLElement;
    this.contentElement = liveElement;

    if (this.type === BLOCK_TYPES.image) {
      // Special handling for images
      const imageURL = this.getImageURL();
      const isSame = imageURL === this.content; // Compare the current content with the image URL
      this.content = isSame ? this.content : imageURL;
      return !isSame; // Return whether the content has changed
    }

    if (this.type === BLOCK_TYPES.video) {
      // Special handling for images
      const videoURL = this.getVideoURL();
      const isSame = videoURL === this.content; // Compare the current content with the image URL
      this.content = isSame ? this.content : videoURL;
      return !isSame; // Return whether the content has changed
    }

    // Default handling for other types
    const isSame = clonedElement?.innerHTML === this.content;
    this.content = isSame ? this.content : (clonedElement?.innerHTML ?? "");
    return !isSame; // Return whether the content has changed
  };

  public getContent = () => {
    this.updateContent();
    return this.content;
  };

  public isContentEmpty = (): boolean => {
    const contentEmpty = /^[\s\u00A0\u200B]*$/.test(this.content);
    const hasColumnContent = this.columns.some((column) =>
      column.blox.some((child) => !child.isContentEmpty()),
    );
    return contentEmpty && !hasColumnContent;
  };

  public setContent = (contentString: string) => {
    if (this.type === BLOCK_TYPES.image || this.type === BLOCK_TYPES.video) {
      this.content = contentString; // Store the raw image URL
      if (this.contentElement instanceof HTMLImageElement) {
        this.contentElement.src = this.content;
      }
      if (this.contentElement instanceof HTMLIFrameElement) {
        this.contentElement.src = this.content;
      }
    } else {
      const parser = new DOMParser();
      const doc = parser.parseFromString(contentString, "text/html");
      this.content = doc.body.innerHTML;

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
    this.TypingManager.saveSelection();
  }

  private afterToggle(): void {
    requestAnimationFrame(() => {
      this.TypingManager.restoreSelection();
      this.sendUpdateStyleEvent();
    });
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
      return this.StyleManager.getStyle().isBold;
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
      return this.StyleManager.getStyle().isItalic;
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
      return this.StyleManager.getStyle().isStrikeout;
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
      return this.StyleManager.getStyle().isUnderline;
    });
  }

  clearStyle(): void {
    return this.executeWithCallbacks(() => {
      if (document.queryCommandSupported("removeFormat")) {
        document.execCommand("removeFormat");
        this.StyleManager.unapplyFormat("mark"); // mark element can't be removed by execCommand
      } else {
        this.StyleManager.clearFormat();
      }
    });
  }

  applyStyle(tagName: string, style: Record<string, string>): void {
    this.executeWithCallbacks(() => {
      if (document.queryCommandSupported("styleWithCSS")) {
        document.execCommand("styleWithCSS", false, "true");

        if (style.backgroundColor) {
          document.execCommand("backColor", false, style.backgroundColor);
        }

        if (style.color) {
          document.execCommand("foreColor", false, style.color);
        }

        if (style.fontFamily) {
          document.execCommand("fontName", false, style.fontFamily);
        }
      } else {
        this.StyleManager.applyFormat(tagName, style);
      }
    });
  }

  toggleType(newType: BlockType): void {
    if (this.type === newType) return; // No change needed

    const wasList = this.isListType(this.type);
    this.clearDefaults(); // removed old type defaults
    this.type = newType;
    this.applyDefaults(); // apply new type default

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

  clearDefaults() {
    if (BLOCKS_SETTINGS[this.type].defaults.styles) {
      const defaultStyles = this.getStyles(
        BLOCKS_SETTINGS[this.type].defaults.styles,
      );
      Object.entries(defaultStyles).forEach(([key, value]) => {
        if (this.getStyles()[key] === value) {
          this.removeStyle(key);
        }
      });
    }
    if (BLOCKS_SETTINGS[this.type].defaults.attributes) {
      const defaultAttributes = this.getAttributes(
        BLOCKS_SETTINGS[this.type].defaults.attributes,
      );
      Object.entries(defaultAttributes).forEach(([key, value]) => {
        if (this.getAttributes()[key] === value) {
          this.removeAttribute(key);
        }
      });
    }
    if (BLOCKS_SETTINGS[this.type].defaults.classes) {
      const defaultClasses = this.getClasses(
        BLOCKS_SETTINGS[this.type].defaults.classes,
      );
      defaultClasses.forEach((classString: string) => {
        this.removeClass(classString);
      });
    }
  }

  applyDefaults() {
    if (BLOCKS_SETTINGS[this.type].defaults.styles) {
      const defaultStyles = this.getStyles(
        BLOCKS_SETTINGS[this.type].defaults.styles,
      );
      this.setStyles(defaultStyles);
    }
    if (BLOCKS_SETTINGS[this.type].defaults.attributes) {
      const defaultAttributes = this.getAttributes(
        BLOCKS_SETTINGS[this.type].defaults.attributes,
      );
      this.setAttributes(defaultAttributes);
    }
    if (BLOCKS_SETTINGS[this.type].defaults.classes) {
      const defaultClasses = this.getClasses(
        BLOCKS_SETTINGS[this.type].defaults.classes,
      );
      defaultClasses.forEach((classString: string) => {
        this.addClass(classString);
      });
    }
  }

  // Utility methods for better readability
  private isListType(type: BlockType): boolean {
    return (
      type === BLOCK_TYPES.numberedList || type === BLOCK_TYPES.bulletedList
    );
  }

  private shouldClearContent(type: BlockType): boolean {
    const contentElement = this.getContentElement();
    const isEmptyContent =
      !contentElement || isEmpty(contentElement) || this.content.trim() === "/";
    return (
      isEmptyContent ||
      (isEmptyContent && type === BLOCK_TYPES.code) ||
      type === BLOCK_TYPES.image ||
      type === BLOCK_TYPES.video
    );
  }

  pasteContent(e: ClipboardEvent) {
    this.PasteManager.pasteContent(e);
    this.sendUpdateBloxEvent();
  }

  // Getter for styles
  public getStyles(stylesString?: string): Record<string, string> {
    const styleMap: Record<string, string> = {};
    const blockStyles = stylesString ?? this.styles;
    blockStyles
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

    this.sendUpdateStyleEvent();
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

    this.sendUpdateStyleEvent();
  }

  // Remove a specific style
  public removeStyle(property: string): void {
    const styles = this.getStyles();
    delete styles[convertToCamelCase(property)];
    this.styles = Object.entries(styles)
      .map(([key, val]) => `${key}: ${val}`)
      .join("; ");
    this.sendUpdateStyleEvent();
  }

  // Clear all styles
  public clearStyles(): void {
    this.styles = "";
    this.sendUpdateStyleEvent();
  }

  // Getter for classes
  public getClasses(classesString?: string): string[] {
    const blockClasses = classesString ?? this.classes;
    return blockClasses.split(" ").filter((cls) => cls.trim());
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
  public getAttributes(attributesString?: string): Record<string, string> {
    const attributesMap: Record<string, string> = {};
    const blockAttributes = attributesString ?? this.attributes;

    // Use a regex to correctly capture key="value" or key='value'
    const regex = /([\w-]+)=["']?([^"']+)["']?/g;
    let match;

    while ((match = regex.exec(blockAttributes)) !== null) {
      const key = match[1].trim();
      const value = match[2].trim();
      attributesMap[key] = value;
    }

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

    this.sendUpdateStyleEvent();
  }

  // Setter for multiple attributes
  public setAttributes(attributes: Record<string, string>): void {
    const currentAttributes = this.getAttributes();

    // Merge new attributes into the existing ones
    Object.entries(attributes).forEach(([key, value]) => {
      currentAttributes[key.trim()] = value.trim();
    });

    // Convert the updated attributes back to a string, ensuring all values use double quotes
    this.attributes = Object.entries(currentAttributes)
      .map(([key, val]) => `${key}="${val.replace(/"/g, "&quot;")}"`)
      .join("; ");

    this.sendUpdateStyleEvent();
  }

  // Remove a specific attribute
  public removeAttribute(attribute: string): void {
    const attributes = this.getAttributes();
    delete attributes[attribute.trim()];
    this.attributes = Object.entries(attributes)
      .map(([key, val]) => `${key}="${val}"`)
      .join("; ");
    this.sendUpdateStyleEvent();
  }

  // Clear all attributes
  public clearAttributes(): void {
    this.attributes = "";
    this.sendUpdateStyleEvent();
  }

  public setIsSelected(isSelected: boolean): void {
    this.isSelected = isSelected;
    this.sendUpdateBloxEvent();
  }

  sendUpdateStyleEvent(): void {
    this.StyleManager?.updateCurrentStyles(this);
    setTimeout(() => this.HistoryManager?.saveState(), 500);
  }

  sendUpdateBloxEvent(): void {
    this.emit(EVENTS.blocksChanged);
  }
}
