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
  private globalIdCounter = 1000;

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

  private findBlockContext(
    id: string,
    list: Blox[] = this.blocks,
    parentList: Blox[] | null = null,
  ): { list: Blox[]; index: number; parentList: Blox[] | null } {
    for (let i = 0; i < list.length; i++) {
      const blk = list[i];
      if (blk.id === id) {
        return { list, index: i, parentList };
      }
      // Search within columns if present
      if (blk.columns && blk.columns.length) {
        for (const column of blk.columns) {
          const colList = column.blox;
          const found = this.findBlockContext(id, colList, list);
          if (found.index !== -1) {
            return found;
          }
        }
      }
    }
    return { list: this.blocks, index: -1, parentList: null };
  }

  public addBlockAfter(
    blockId: string,
    type: BlockType,
    content: string = "",
    select: boolean = true,
  ): string | null {
    const ctx = this.findBlockContext(blockId);
    if (ctx.index === -1) {
      console.warn(`Block with ID ${blockId} not found`);
      return null;
    }
    const list = ctx.list;
    const newId = Date.now().toString();
    const newBlock = this.createBlox({ id: newId, type, content });
    if (!newBlock) return null;
    list.splice(ctx.index + 1, 0, newBlock);
    this.sendUpdateEvent();
    if (select) setTimeout(() => this.DOMManager?.focusBlock(newId, true), 100);
    return newId;
  }

  public findBlockIndex(blockId: string): number {
    return this.blocks.findIndex((block) => block.id === blockId);
  }

  public addBlockBefore(
    blockId: string,
    type: BlockType,
    content: string = "",
    select: boolean = true,
  ): string | null {
    const ctx = this.findBlockContext(blockId);
    if (ctx.index === -1) {
      console.warn(`Block with ID ${blockId} not found`);
      return null;
    }
    const list = ctx.list;
    const newId = Date.now().toString();
    const newBlock = this.createBlox({ id: newId, type, content });
    if (!newBlock) return null;
    list.splice(ctx.index, 0, newBlock);
    this.sendUpdateEvent();
    if (select) setTimeout(() => this.DOMManager?.focusBlock(newId, true), 100);
    return newId;
  }

  public getBlockById(id: string | undefined): Blox | undefined {
    if (!id) return undefined;
    const { list, index } = this.findBlockContext(id);
    return index !== -1 ? list[index] : undefined;
  }

  public getBlockIndex(id: string | undefined): number {
    if (!id) return -1;
    const { index } = this.findBlockContext(id);
    return index;
  }

  public getParentBlockId(id: string): string | null {
    const topLevelParent = this.findBlockContext(id);
    if (topLevelParent.parentList === null) {
      return null; // This block is a top-level block, so it has no parent
    }

    const { parentList } = topLevelParent;
    if (parentList.length === 1) {
      return parentList[0].id; // This block is the only child of its parent
    }
    return null;
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
    const generateId = id ?? `${Date.now()}-${this.globalIdCounter++}`;
    const blockSettings = BLOCKS_SETTINGS[type];
    const newContent = content.trim() === "/" ? "" : content;
    const finalContent =
      newContent.trim() === ""
        ? blockSettings.contentPattern(newContent)
        : newContent;
    const block = new Blox({
      id: generateId,
      type,
      content: finalContent,
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

    if (type === BLOCK_TYPES.columns) {
      block.columns = [
        { blox: [this.createBlox({ type: BLOCK_TYPES.text, content: "" })!] },
        { blox: [this.createBlox({ type: BLOCK_TYPES.text, content: "" })!] },
      ];
    }
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
    const { list, index, parentList } = this.findBlockContext(blockId);
    if (index === -1) return false;

    // remove it
    list.splice(index, 1);
    this.HistoryManager?.saveState();

    // if we just emptied a columns wrapper, you might want to delete it too:
    if (parentList && list.length === 0) {
      const { list: grandList, index: parentIdx } = this.findBlockContext(
        parentList[index - 1]?.id!,
      );
      grandList.splice(parentIdx, 1);
    }

    // if top-level went empty, add a blank
    this.fillContextWithEmptyBlock(list);

    this.sendUpdateEvent();
    return true;
  }

  public fillContextWithEmptyBlock(ctx: Blox[]): void {
    if (ctx.length === 0) {
      const newBlock = this.createBlox({ type: BLOCK_TYPES.text });
      if (newBlock) ctx.push(newBlock);
    }
  }

  public moveBlock(
    blockId: string,
    newIndex: number,
    overElementId?: string,
  ): boolean {
    // source
    const { list: fromList, index: fromIdx } = this.findBlockContext(blockId);
    if (fromIdx === -1) return false;

    // remove it
    const [moved] = fromList.splice(fromIdx, 1);

    // destination list: either the same list, or a nested column
    const toList = overElementId
      ? this.findBlockContext(overElementId).list
      : fromList;

    // clamp newIndex
    const destIdx = Math.min(Math.max(newIndex, 0), toList.length);

    toList.splice(destIdx, 0, moved);

    this.sendUpdateEvent();
    this.fillContextWithEmptyBlock(fromList);
    return true;
  }

  public moveBlockUp(blockId: string): boolean {
    const { index } = this.findBlockContext(blockId);
    if (index <= 0) return false;
    return this.moveBlock(blockId, index - 1);
  }

  public moveBlockDown(blockId: string): boolean {
    const { list, index } = this.findBlockContext(blockId);
    if (index === -1 || index >= list.length - 1) return false;
    return this.moveBlock(blockId, index + 1);
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
    const { list, index } = this.findBlockContext(blockId);
    return index > 0 ? list[index - 1] : null;
  }

  public getNextBlock(blockId: string): Blox | null {
    const { list, index } = this.findBlockContext(blockId);
    return index !== -1 && index < list.length - 1 ? list[index + 1] : null;
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
    // locate the block within its list (top-level or column)
    const ctx = this.findBlockContext(blockId);
    const { list, index } = ctx;

    // nothing to merge if at start of list
    if (index <= 0) return;

    const currentBlock = list[index];
    const previousBlock = list[index - 1];

    if (!this.canBeMerged(currentBlock, previousBlock)) return;
    const prevEl = this.DOMManager?.getBlockElementById(previousBlock.id);
    const currEl = this.DOMManager?.getBlockElementById(currentBlock.id);
    if (!prevEl || !currEl) return;

    const markerId = `merge-marker-${Date.now()}`;
    const marker = document.createElement("span");
    marker.id = markerId;
    marker.style.opacity = "0";
    marker.style.position = "absolute";
    marker.textContent = "\u200B";

    prevEl.appendChild(marker);
    prevEl.innerHTML += currentBlock.content;

    list.splice(index, 1);
    const updatedPrevEl = this.DOMManager?.getBlockElementById(
      previousBlock.id,
    );
    const markerEl = updatedPrevEl?.querySelector(`#${markerId}`);
    if (markerEl) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStartAfter(markerEl);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
      setTimeout(() => markerEl.remove(), 50);
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
