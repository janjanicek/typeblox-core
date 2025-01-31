import { EventEmitter } from "../classes/EventEmitter";
import { Blox } from "../classes/Blox";
import { BLOCKS_SETTINGS, BLOCK_TYPES, EVENTS } from "../constants";
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

export class BloxManager extends EventEmitter {
  private blocks: Blox[] = [];

  private TypingManager: TypingManager | null = null;
  private StyleManager: StyleManager | null = null;
  private DOMManager: DOMManager | null = null;
  private PasteManager: PasteManager | null = null;
  private HistoryManager: HistoryManager | null = null;
  private onChange: Function;
  private wasCreatedByUndo: boolean;

  constructor(onChange: Function) {
    super();
    this.onChange = onChange;
    this.blocks = [];
    this.wasCreatedByUndo = false;
  }

  setDependencies(
    TypingManager: TypingManager,
    FormatManager: StyleManager,
    PasteManager: PasteManager,
    DOMManager: DOMManager,
    HistoryManager: HistoryManager,
    onChange: Function,
  ) {
    this.TypingManager = TypingManager;
    this.StyleManager = FormatManager;
    this.PasteManager = PasteManager;
    this.DOMManager = DOMManager;
    this.HistoryManager = HistoryManager;
    this.onChange = onChange;
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

  public setBlox(newBlox: Blox[], isUndo: boolean = false): void {
    if (this.areBloxArraysEqual(this.blocks, newBlox)) {
      return;
    }
    this.blocks = newBlox;
    this.wasCreatedByUndo = isUndo;
  }

  public isAllSelected(): boolean {
    return this.blocks.every((b) => b.isSelected);
  }

  public isAnySelected(): boolean {
    return this.blocks.some((b) => b.isSelected);
  }

  public selectAllBlox(selectAll: boolean): void {
    this.blocks.forEach((b) => (b.isSelected = selectAll));
    this.sendUpdateEvent();
  }

  public isUndo(): boolean {
    return this.wasCreatedByUndo;
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

  public update(
    onChange: Function,
    providedBlocks?: Blox[],
    calledFromEditor?: false,
  ): void {
    const newBlocks = providedBlocks ?? this.getBlox();
    this.setBlox(newBlocks);
    const newStructure = this.DOMManager?.blocksToHTML(newBlocks);

    if (!newStructure) return;

    onChange(newStructure);
    if (!this.wasCreatedByUndo) {
      this.HistoryManager?.saveState(newStructure);
    }

    this.wasCreatedByUndo = false;
    if (!calledFromEditor) this.sendUpdateEvent();
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

    const block = new Blox({
      id: generateId,
      type,
      content,
      onUpdate: this.onChange,
      TypingManager: this.TypingManager!,
      StyleManager: this.StyleManager!,
      PasteManager: this.PasteManager!,
      DOMManager: this.DOMManager!,
      style,
      classes,
      attributes,
    });

    block?.on(EVENTS.styleChange, () => {
      this.StyleManager?.updateCurrentStyles(block);
    });
    block?.on(EVENTS.blocksChanged, () => {
      this.update(this.onChange);
    });

    return block;
  }

  public removeById(blockId: string): boolean {
    const index = this.blocks.findIndex((block) => block.id === blockId);

    if (index === -1) {
      return false;
    }

    // Remove the block from the array
    this.blocks.splice(index, 1);

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

  private sendUpdateEvent(): void {
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
