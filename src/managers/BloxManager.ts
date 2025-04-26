import { EventEmitter } from "../classes/EventEmitter";
import { Blox } from "../classes/Blox";
import { EVENTS } from "../constants";
import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../blockTypes";
import { BlockType } from "../types";
import { StyleManager } from "./StyleManager";
import { PasteManager } from "./PasteManager";
import { TypingManager } from "./TypingManager";
import { DOMManager } from "./DOMManager";
import { HistoryManager } from "./HistoryManager";

interface CreateBloxParams {
  id?: string;
  type?: BlockType;
  content?: string;
  style?: string | null;
  classes?: string | null;
  attributes?: string | null;
}

interface UpdateProps {
  onChange: Function;
  blocks?: Blox[];
  calledFromEditor?: boolean;
  forceUpdate?: boolean;
}

export class BloxManager extends EventEmitter {
  private blocks: Blox[] = [];
  private lastUpdatedContent: string;

  private TypingManager: TypingManager | null = null;
  private StyleManager: StyleManager | null = null;
  private DOMManager: DOMManager | null = null;
  private PasteManager: PasteManager | null = null;
  private HistoryManager: HistoryManager | null = null;
  private onChange: Function;
  private wasHistoryOperation: boolean;

  constructor(onChange: Function) {
    super();
    this.onChange = onChange;
    this.blocks = [];
    this.wasHistoryOperation = false;
    this.lastUpdatedContent = "";
  }

  updateChange(onChange: Function) {
    this.onChange = onChange;
  }

  setDependencies(
    TypingManager: TypingManager,
    FormatManager: StyleManager,
    PasteManager: PasteManager,
    DOMManager: DOMManager,
    HistoryManager: HistoryManager,
  ) {
    this.TypingManager = TypingManager;
    this.StyleManager = FormatManager;
    this.PasteManager = PasteManager;
    this.DOMManager = DOMManager;
    this.HistoryManager = HistoryManager;
  }

  private areDependenciesSet = () =>
    this.TypingManager &&
    this.StyleManager &&
    this.PasteManager &&
    this.DOMManager &&
    this.onChange;

  public addBlockAfter(
    blockId: string,
    type: BlockType,
    content: string = "",
    select: boolean = true,
  ): string | null {
    const index = this.blocks.findIndex((block) => block.id === blockId);
    if (index === -1) {
      console.warn(`Block with ID ${blockId} not found`);
      return null;
    }

    const newBlockId = Date.now().toString();
    const newBlock = this.createBlox({
      id: newBlockId,
      type,
      content,
    });

    if (!newBlock) {
      console.error(
        "Failed to create a new block. Dependencies may not be set.",
      );
      return null;
    }

    // Insert the new block after the found index
    this.blocks.splice(index + 1, 0, newBlock);
    this.sendUpdateEvent();

    // Optionally focus the new block
    if (select) {
      setTimeout(() => this.DOMManager?.focusBlock(newBlockId, true), 100);
    }

    return newBlockId;
  }

  public addBlockBefore(
    blockId: string,
    type: BlockType,
    content: string = "",
    select: boolean = true,
  ): string | null {
    const index = this.blocks.findIndex((block) => block.id === blockId);
    if (index === -1) {
      console.warn(`Block with ID ${blockId} not found`);
      return null;
    }

    const newBlockId = Date.now().toString();
    const newBlock = this.createBlox({
      id: newBlockId,
      type,
      content,
    });

    if (!newBlock) {
      console.error(
        "Failed to create a new block. Dependencies may not be set.",
      );
      return null;
    }

    // Insert the new block before the found index
    this.blocks.splice(index, 0, newBlock);

    this.emit(EVENTS.blocksChanged, [...this.blocks]);

    // Optionally focus the new block
    if (select) {
      setTimeout(() => this.DOMManager?.focusBlock(newBlockId, true), 100);
    }

    return newBlockId;
  }

  public getBlockById(id: string | undefined): Blox | undefined {
    return this.blocks?.find((block: Blox) => block.id === id);
  }

  public getBlox(): Blox[] {
    return this.blocks;
  }

  public setBlox(newBlox: Blox[], isHistoryOperation: boolean = false): void {
    if (this.areBloxArraysEqual(this.blocks, newBlox)) {
      return;
    }
    this.blocks = newBlox;
    this.wasHistoryOperation = isHistoryOperation;
  }

  public isAllSelected(): boolean {
    return this.blocks.every((b) => b.isSelected);
  }

  public isAnySelected(): boolean {
    return this.blocks.some((b) => b.isSelected);
  }

  public selectAllBlox(selectAll: boolean): void {
    if (selectAll === this.isAllSelected()) return;
    this.blocks.forEach((b) => (b.isSelected = selectAll));
    this.sendUpdateEvent();
  }

  public isHistoryOperation(): boolean {
    return this.wasHistoryOperation;
  }

  private areBloxArraysEqual(array1: Blox[], array2: Blox[]): boolean {
    if (array1.length !== array2.length) {
      return false;
    }

    return array1.every((block, index) => {
      const otherBlock = array2[index];
      return (
        block.id === otherBlock.id &&
        block.type === otherBlock.type &&
        block.content === otherBlock.content
      );
    });
  }

  public update({
    onChange,
    blocks,
    calledFromEditor = false,
    forceUpdate = false,
  }: UpdateProps): void {
    if (blocks) blocks.forEach((block) => this.registerEvents(block));
    const newBlocks = blocks ?? this.getBlox();
    const structureBeforeChange = this.DOMManager?.blocksToHTML(this.blocks);
    const newStructure = this.DOMManager?.blocksToHTML(newBlocks);

    this.setBlox(newBlocks);

    if (!newStructure) return;

    if (newStructure === this.lastUpdatedContent && !forceUpdate) {
      console.log("Typeblox: Update skipped structures are the same");
      return;
    }

    this.lastUpdatedContent = newStructure;

    onChange(newStructure);

    if (!this.wasHistoryOperation) {
      if (structureBeforeChange) {
        this.HistoryManager?.saveState(structureBeforeChange);
      }
    }

    this.wasHistoryOperation = false;
    if (!calledFromEditor) {
      this.sendUpdateEvent();
    }
  }

  public createBlox({
    id,
    type = BLOCK_TYPES.text,
    content = "",
    style = "",
    classes = "",
    attributes = "",
  }: CreateBloxParams): Blox | null {
    if (!this.areDependenciesSet()) return null;

    const generateId = id || Date.now().toString();
    const blockSettings = BLOCKS_SETTINGS[type];
    const updatedContent = content.trim() === "/" ? "" : content;
    const newBlockContent =
      updatedContent.trim() === ""
        ? blockSettings.contentPattern(updatedContent)
        : updatedContent;

    const block = new Blox({
      id: generateId,
      type,
      content: newBlockContent,
      onUpdate: this.onChange,
      TypingManager: this.TypingManager!,
      StyleManager: this.StyleManager!,
      PasteManager: this.PasteManager!,
      DOMManager: this.DOMManager!,
      HistoryManager: this.HistoryManager!,
      style,
      classes,
      attributes,
    });
    this.registerEvents(block);
    return block;
  }

  private registerEvents(block: Blox) {
    if (!block._listeners) {
      block._listeners = {};
    }

    // If listeners exist, remove them first
    if (block._listeners[EVENTS.styleChange]) {
      block.off(EVENTS.styleChange, block._listeners[EVENTS.styleChange]);
    }
    if (block._listeners[EVENTS.blocksChanged]) {
      block.off(EVENTS.blocksChanged, block._listeners[EVENTS.blocksChanged]);
    }

    // Define handlers and store them
    block._listeners[EVENTS.styleChange] = () => {
      this.StyleManager?.updateCurrentStyles(block);
    };

    block._listeners[EVENTS.blocksChanged] = () => {
      this.update({ onChange: this.onChange, forceUpdate: true });
    };

    // Register events using stored handlers
    block.on(EVENTS.styleChange, block._listeners[EVENTS.styleChange]);
    block.on(EVENTS.blocksChanged, block._listeners[EVENTS.blocksChanged]);
  }

  public removeById(blockId: string): boolean {
    const index = this.blocks.findIndex((block) => block.id === blockId);

    if (index === -1) {
      return false;
    }

    // Remove the block from the array
    this.blocks.splice(index, 1);
    this.HistoryManager?.saveState();

    if (this.blocks.length === 0) {
      // If removing the last block, add a new empty one.
      const newBlock = this.createBlox({});
      if (newBlock) {
        this.setBlox([newBlock]);
      }
    }

    // Emit the blocksChanged event
    this.sendUpdateEvent();

    return true;
  }

  public moveBlock(blockId: string, newIndex: number): boolean {
    const currentIndex = this.blocks.findIndex((block) => block.id === blockId);

    // Prevent invalid moves
    if (
      currentIndex === -1 ||
      newIndex < 0 ||
      newIndex >= this.blocks.length ||
      currentIndex === newIndex
    ) {
      return false;
    }

    // Remove block from current position
    const [movedBlock] = this.blocks.splice(currentIndex, 1);

    // Insert block at the new index
    this.blocks.splice(newIndex, 0, movedBlock);

    this.sendUpdateEvent();
    return true;
  }

  public moveBlockUp(blockId: string): boolean {
    const index = this.blocks.findIndex((block) => block.id === blockId);

    if (index <= 0) {
      return false;
    }

    [this.blocks[index - 1], this.blocks[index]] = [
      this.blocks[index],
      this.blocks[index - 1],
    ];

    this.sendUpdateEvent();
    return true;
  }

  public moveBlockDown(blockId: string): boolean {
    const index = this.blocks.findIndex((block) => block.id === blockId);

    if (index === -1 || index >= this.blocks.length - 1) {
      return false;
    }

    [this.blocks[index], this.blocks[index + 1]] = [
      this.blocks[index + 1],
      this.blocks[index],
    ];

    this.sendUpdateEvent();
    return true;
  }

  public split(blockId: string): void {
    const blockElement = this.DOMManager?.getBlockElementById(blockId);
    const blox = this.getBlockById(blockId);
    if (!blockElement || !blox || !(blockElement instanceof HTMLElement))
      return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    const splitPoint = document.createElement("split-point");
    range.insertNode(splitPoint);

    const splitPointElement = blockElement.querySelector("split-point");
    if (!splitPointElement) return;

    const beforeRange = document.createRange();
    beforeRange.setStart(blockElement, 0);
    beforeRange.setEndBefore(splitPointElement);

    const beforeContent = beforeRange.cloneContents();
    const beforeCaretContainer = document.createElement("div");
    beforeCaretContainer.appendChild(beforeContent);
    const beforeCaret = beforeCaretContainer.innerHTML.trim();

    const afterRange = document.createRange();
    afterRange.setStartAfter(splitPointElement);
    afterRange.setEnd(blockElement, blockElement.childNodes.length);

    const afterContent = afterRange.cloneContents();
    const afterCaretContainer = document.createElement("div");
    afterCaretContainer.appendChild(afterContent);
    const afterCaret = afterCaretContainer.innerHTML.trim();

    splitPoint.remove();

    if (!beforeCaret || !afterCaret) {
      console.warn("Split aborted: No content before or after the caret.");
      return;
    }

    const bloxType = blox.type || BLOCK_TYPES.text;

    blockElement.innerHTML = beforeCaret;
    blox.setContent(beforeCaret);

    const newBlockId = this.addBlockAfter(blockId, bloxType, afterCaret);
    if (!newBlockId) {
      console.error("Failed to create a new block after splitting");
      return;
    }

    setTimeout(() => {
      this.DOMManager?.focusBlock(newBlockId, false);
    }, 100);
  }

  public getPreviousBlock(blockId: string): Blox | null {
    const blockIndex = this.blocks.findIndex((block) => block.id === blockId);
    if (blockIndex <= 0) return null;
    return this.blocks[blockIndex - 1];
  }

  public getNextBlock(blockId: string): Blox | null {
    const blockIndex = this.blocks.findIndex((block) => block.id === blockId);
    if (blockIndex >= this.blocks.length) return null;
    return this.blocks[blockIndex + 1];
  }

  private canBeMerged(currentBlock: Blox, previousBlock: Blox): boolean {
    return (
      previousBlock.type === currentBlock.type ||
      BLOCKS_SETTINGS[previousBlock.type].availableTypes.includes(
        currentBlock.type,
      )
    );
  }

  public merge(blockId: string): void {
    const blockIndex = this.blocks.findIndex((block) => block.id === blockId);
    if (blockIndex <= 0) return; // No previous block to merge with

    const currentBlock = this.blocks[blockIndex];
    const previousBlock = this.blocks[blockIndex - 1];

    if (!this.canBeMerged(currentBlock, previousBlock)) return;

    const previousBlockElement = this.DOMManager?.getBlockElementById(
      previousBlock.id,
    );
    const currentBlockElement = this.DOMManager?.getBlockElementById(
      currentBlock.id,
    );

    if (!previousBlockElement || !currentBlockElement) return;

    const markerId = `merge-marker-${Date.now()}`;
    const marker = document.createElement("span");
    marker.id = markerId;
    marker.style.opacity = "0"; // Make it invisible
    marker.style.position = "absolute"; // Prevent affecting layout
    marker.textContent = "\u200B"; // Zero-width space to ensure it's focusable

    previousBlockElement.appendChild(marker);
    previousBlockElement.innerHTML += currentBlock.content;

    this.blocks.splice(blockIndex, 1);

    const updatedPreviousBlockElement = this.DOMManager?.getBlockElementById(
      previousBlock.id,
    );
    const markerElement = updatedPreviousBlockElement?.querySelector(
      `#${markerId}`,
    );

    if (markerElement) {
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStartAfter(markerElement);
      range.collapse(true);

      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setTimeout(() => markerElement.remove(), 50);
    }

    this.sendUpdateEvent();
  }

  public sendUpdateEvent(): void {
    this.emit(EVENTS.blocksChanged, [...this.blocks]);
  }

  public getCurrentBlock(): Blox | null {
    const currentBlockElement =
      this.DOMManager?.getBlockElement() as HTMLElement;
    if (currentBlockElement) {
      const blockId = currentBlockElement.dataset.typebloxId;
      if (blockId) {
        return this.getBlockById(blockId) ?? null;
      }
    }
    return null;
  }
}
