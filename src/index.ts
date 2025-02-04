import { CLASSES, EVENTS } from "./constants";
import {
  CustomRange,
  detectedStyles,
  imageUploadFunction,
  onChangeFunction,
  Extension,
} from "./types";
import { EventEmitter } from "events";
import { Blox } from "./classes/Blox";
import { StyleManager } from "./managers/StyleManager";
import { registerListeners, removeListeners } from "./utils/listeners";
import { HistoryManager } from "./managers/HistoryManager";
import { TypingManager } from "./managers/TypingManager";
import { DOMManager } from "./managers/DOMManager";
import { BloxManager } from "./managers/BloxManager";
import { PasteManager } from "./managers/PasteManager";
import { ExtensionsManager } from "./managers/ExtensionsManager";
import { ShortcutsManager } from "./managers/ShortcutsManager";
import { LinkManager } from "./managers/LinkManager";

export interface TypeBloxInitOptions {
  elementSelector?: string; // Optional parameter
  HTMLString: string; // Required parameter
  onUpdate: onChangeFunction;
  onImageUpload?: imageUploadFunction;
  extensions?: Extension[] | null;
}

class Typeblox extends EventEmitter {
  private HistoryManager: HistoryManager;

  private TypingManager: TypingManager;

  private StyleManager: StyleManager;

  private DOMManager: DOMManager;

  private BloxManager: BloxManager;

  private PasteManager: PasteManager;

  private ExtensionsManager: ExtensionsManager;

  private ShortcutsManager: ShortcutsManager;

  private LinkManager: LinkManager;

  public onChange: onChangeFunction = (updatedHTMLString: string) => {
    sessionStorage.setItem("tempEditorContent", updatedHTMLString);
  };

  public onImageUpload: imageUploadFunction = (
    blobInfo: any,
    success: Function,
    failure: Function,
  ) => {
    try {
      const blob = blobInfo.blob(); // Get the blob object from blobInfo
      const blobName = blobInfo.filename(); // Assume blobInfo has a filename method
      const blobURL = URL.createObjectURL(blob); // Create a temporary URL for the blob

      // Simulate a success callback with the URL
      success(blobURL);
    } catch (error) {
      // If there's an error, call the failure callback with the error message
      failure("Failed to upload the image");
    }
  };

  private currentSelection: CustomRange = { start: 0, end: 0 };

  isSameSelection(newStart: number, newEnd: number): boolean {
    const isSame =
      this.currentSelection.start === newStart &&
      this.currentSelection.end === newEnd;
    return isSame;
  }

  constructor() {
    super();

    this.HistoryManager = new HistoryManager(25);
    this.TypingManager = new TypingManager();
    this.PasteManager = new PasteManager(); // No dependencies initially
    this.StyleManager = new StyleManager(); // No dependencies initially
    this.BloxManager = new BloxManager(this.onChange); // No dependencies initially
    this.DOMManager = new DOMManager(); // No dependencies initially
    this.ExtensionsManager = new ExtensionsManager();
    this.ShortcutsManager = new ShortcutsManager();
    this.LinkManager = new LinkManager();

    this.PasteManager.setDependencies(this.DOMManager, this.BloxManager);
    this.StyleManager.setDependencies(
      this.DOMManager,
      this.TypingManager,
      this.LinkManager,
    );
    this.BloxManager.setDependencies(
      this.TypingManager,
      this.StyleManager,
      this.PasteManager,
      this.DOMManager,
      this.HistoryManager,
      this.onChange,
    );
    this.DOMManager.setDependencies(this.BloxManager, this.TypingManager);
    this.ShortcutsManager.setDependencies(
      this.BloxManager,
      this.DOMManager,
      this.TypingManager,
      this.HistoryManager,
    );

    this.BloxManager.on(EVENTS.blocksChanged, (blocks) => {
      this.emit(EVENTS.blocksChanged, blocks);
    });

    this.BloxManager.on(EVENTS.styleChange, (block) => {
      this.emit(EVENTS.styleChange, block);
    });

    this.StyleManager.on(EVENTS.styleChange, (block) => {
      this.emit(EVENTS.styleChange, block);
    });

    registerListeners(this.detectSelection);
  }

  // Public methods
  public init(options: TypeBloxInitOptions): void {
    const { HTMLString, onUpdate, onImageUpload, extensions } = options;
    if (HTMLString)
      this.blox().setBlox(this.elements().parseHTMLToBlocks(HTMLString));
    if (onUpdate) this.onChange = onUpdate;
    if (onImageUpload) this.onImageUpload = this.onImageUpload;
    if (extensions) this.registerAllExtensions(extensions);
  }

  private registerAllExtensions(extensions: Extension[]): void {
    extensions.forEach((extension) => {
      this.extensions().registerExtension(extension);
    });
  }

  public destroy(): void {
    this.blox().setBlox([]);
    this.ShortcutsManager.unregisterShortcuts();
    this.onChange = () => {};
    removeListeners(this.detectSelection);
  }

  public selection(): TypingManager {
    return this.TypingManager;
  }

  public style(): StyleManager {
    return this.StyleManager;
  }

  public blox(): BloxManager {
    return this.BloxManager;
  }

  public extensions(): ExtensionsManager {
    return this.ExtensionsManager;
  }

  public elements(): DOMManager {
    return this.DOMManager;
  }

  public link(): LinkManager {
    return this.LinkManager;
  }

  public paste(): PasteManager {
    return this.PasteManager;
  }

  public getBlockById(id: string | undefined): Blox | undefined {
    return this.blox().getBlockById(id);
  }

  public getBlockElementById(id: string | undefined): HTMLElement | null {
    if (!id) return null;
    return this.DOMManager.getBlockElementById(id);
  }

  public getSelectionStyle(): detectedStyles {
    return this.style().getStyle();
  }

  public getSelectionElement(): HTMLElement | null {
    const blockElement = this.DOMManager.getBlockElement();
    if (blockElement) {
      return blockElement.querySelector(`.${CLASSES.selected}`);
    }
    return null;
  }

  public unselect(element: HTMLElement | null, callBack?: () => void): void {
    let currentSelection = element;
    if (!currentSelection) currentSelection = this.getSelectionElement();

    try {
      this.TypingManager.removeSelection(currentSelection);
    } catch (error) {
      console.error("Error removing selection:", error);
      return;
    }
    this.handleSelectionChange();
    this.executeCallback(callBack);
  }

  public select(range: Range, callBack?: () => void): void {
    try {
      this.TypingManager.createSelectedElement(range);
    } catch (error) {
      console.error("Error creating selected element:", error);
      return;
    }
    this.handleSelectionChange();
    this.executeCallback(callBack);
  }

  private executeCallback(callBack?: () => void): void {
    if (callBack && typeof callBack === "function") {
      try {
        callBack();
      } catch (error) {
        console.error("Error executing callback:", error);
      }
    }
  }

  private handleSelectionChange(): void {
    this.emit(EVENTS.selectionChange, this.style().getStyle());
  }

  public isStyle(style: string): boolean {
    switch (style) {
      case "bold": {
        return this.style().getStyle().isBold;
      }
      case "italic": {
        return this.style().getStyle().isItalic;
      }
      case "underline": {
        return this.style().getStyle().isUnderline;
      }
      case "strikethrough": {
        return this.style().getStyle().isStrikeout;
      }
      default:
        break;
    }
    return false;
  }

  public getStyle(style: string): string {
    const styles: any = this.getSelectionStyle();
    return styles[style];
  }

  private detectSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const start = range.startOffset;
      const end = range.endOffset;

      // Get the parent element of the range
      const parentElement =
        range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement;

      const editorElement = (parentElement as HTMLElement)?.closest(
        "[data-typeblox-editor]",
      );

      if (editorElement && !this.isSameSelection(start, end)) {
        this.currentSelection = { start, end };
        this.emit(EVENTS.selectionChange, this.style().getStyle());
      }
    }
  };

  private getCurrentDom = () => {
    return this.DOMManager.blocksToHTML(this.blox().getBlox());
  };

  private updateEditorContent = (
    newContent: string,
    isUndo: boolean = false,
  ) => {
    this.blox().setBlox(this.elements().parseHTMLToBlocks(newContent), isUndo);
    this.emit(EVENTS.blocksChanged, this.blox().getBlox());
  };

  // Undo
  public handleUndo = () => {
    const previousState = this.HistoryManager?.undo(this.getCurrentDom());
    if (previousState) {
      this.updateEditorContent(previousState, true);
    }
  };

  // Redo
  public handleRedo = () => {
    const nextState = this.HistoryManager?.redo();
    if (nextState) {
      this.updateEditorContent(nextState);
    }
  };
}

export default Typeblox;
