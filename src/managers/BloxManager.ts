import { EventEmitter } from "../classes/EventEmitter";
import { Blox } from "../classes/Blox";
import { BLOCK_TYPES, EVENTS } from "../constants";
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

    this.emit(EVENTS.blocksChanged, [...this.blocks]);

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
    if (!calledFromEditor) this.emit(EVENTS.blocksChanged, this.getBlox());
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
    this.emit(EVENTS.blocksChanged, [...this.blocks]);

    return true;
  }

  public moveBlockUp(blockId: string): boolean {
    const index = this.blocks.findIndex((block) => block.id === blockId);

    if (index <= 0) {
      // Block is already at the top or not found
      return false;
    }

    // Swap the block with the one above it
    [this.blocks[index - 1], this.blocks[index]] = [
      this.blocks[index],
      this.blocks[index - 1],
    ];

    // Emit the updated blocks array
    this.emit(EVENTS.blocksChanged, [...this.blocks]);
    return true;
  }

  public moveBlockDown(blockId: string): boolean {
    const index = this.blocks.findIndex((block) => block.id === blockId);

    if (index === -1 || index >= this.blocks.length - 1) {
      // Block is already at the bottom or not found
      return false;
    }

    // Swap the block with the one below it
    [this.blocks[index], this.blocks[index + 1]] = [
      this.blocks[index + 1],
      this.blocks[index],
    ];

    // Emit the updated blocks array
    this.emit(EVENTS.blocksChanged, [...this.blocks]);
    return true;
  }

  public split(blockId: string): void {
    const blockElement = this.DOMManager?.getBlockElementById(blockId);
    const blox = this.getBlockById(blockId);
    if (!blockElement || !blox) return;

    // Get the current selection and caret position
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const caretPosition = range.startOffset;

    // Extract the block's content
    const fullContent = blox.content || ""; // Use the content stored in the block
    const beforeCaret = fullContent.slice(0, caretPosition).trim(); // Trim whitespace
    const afterCaret = fullContent.slice(caretPosition).trim(); // Trim whitespace

    // Prevent splitting if the content before or after the caret is empty or contains only <br>
    if (
      !beforeCaret ||
      !afterCaret ||
      beforeCaret === "<br>" ||
      afterCaret === "<br>"
    ) {
      return;
    }

    const bloxType = blox.type || BLOCK_TYPES.text;

    // Update the current block with the content before the caret
    blox.setContent(beforeCaret);

    // Add a new block with the content after the caret
    const newBlockId = this.addBlockAfter(blockId, bloxType, afterCaret);
    if (!newBlockId) return;

    // Focus the new block after a short delay
    setTimeout(() => {
      this.DOMManager?.focusBlock(newBlockId, false);
    }, 100);
  }

  public merge(blockId: string): void {
    const blockIndex = this.blocks.findIndex((block) => block.id === blockId);
    if (blockIndex <= 0) return; // No previous block to merge with

    const currentBlock = this.blocks[blockIndex];
    const previousBlock = this.blocks[blockIndex - 1];

    // Merge content of the current block into the previous block
    previousBlock.content += currentBlock.content;

    // Remove the current block
    this.blocks.splice(blockIndex, 1);

    // Emit blocksChanged event to update the UI
    this.emit(EVENTS.blocksChanged, [...this.blocks]);

    this.DOMManager?.focusBlock(previousBlock.id, true);
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
