import { isEmpty } from "../utils/elements";
import { BLOCK_TYPES, DEFAULT_BLOCK_TYPE } from "../constants";
import { BloxManager } from "./BloxManager";
import { DOMManager } from "./DOMManager";
import { HistoryManager } from "./HistoryManager";
import { TypingManager } from "./TypingManager";

export class ShortcutsManager {
  private DOMManager: DOMManager | null = null;
  private BloxManager: BloxManager | null = null;
  private TypingManager: TypingManager | null = null;
  private HistoryManager: HistoryManager | null = null;
  private shortcutHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    initialBloxManager?: BloxManager,
    initialDOMManager?: DOMManager,
    initialTypingManager?: TypingManager,
    initialHistoryManager?: HistoryManager,
  ) {
    if (initialBloxManager) {
      this.BloxManager = initialBloxManager;
    }
    if (initialDOMManager) {
      this.DOMManager = initialDOMManager;
    }
    if (initialTypingManager) {
      this.TypingManager = initialTypingManager;
    }
    if (initialHistoryManager) {
      this.HistoryManager = initialHistoryManager;
    }
    this.registerShortcuts();
  }

  setDependencies(
    BloxManager: BloxManager,
    DOMManager: DOMManager,
    TypingManager: TypingManager,
    HistoryManager: HistoryManager,
  ) {
    this.BloxManager = BloxManager;
    this.DOMManager = DOMManager;
    this.TypingManager = TypingManager;
    this.HistoryManager = HistoryManager;
  }

  registerShortcuts(): void {
    this.unregisterShortcuts(); // Ensure we don’t register multiple handlers

    this.shortcutHandler = (event: KeyboardEvent) => {
      let blockElement: HTMLElement | undefined | null = null;
      const currentBlockFromEvent = this.DOMManager?.getBlockFromEvent(event);
      const currentBlock = this.BloxManager?.getCurrentBlock();
      const isBlockEvent = currentBlockFromEvent === currentBlock;
      const isBlockContext = isBlockEvent && currentBlock;
      if (currentBlock)
        blockElement = this.DOMManager?.getBlockElementById(currentBlock.id);

      // Select all
      if ((event.metaKey || event.ctrlKey) && event.key === "a") {
        event.preventDefault();
        if (isBlockContext) {
          // block context
          if (this.BloxManager?.isAnySelected()) {
            this.BloxManager?.selectAllBlox(true);
          } else {
            if (!currentBlock.isSelected) {
              event.stopPropagation();
              currentBlock.setIsSelected(true);
            }
          }
        } else {
          // editor content
          event.preventDefault();
          this.BloxManager?.selectAllBlox(true);
        }
      }

      if (event.key === "Backspace") {
        if (this.BloxManager?.isAllSelected()) {
          event.preventDefault();
          const newBlock = this.BloxManager?.createBlox({});
          if (newBlock) {
            this.BloxManager?.setBlox([newBlock]);
            this.BloxManager?.selectAllBlox(false);
          }
          return;
        }
        if (isBlockContext && blockElement) {
          const isCursorAtStart =
            this.TypingManager?.isCursorAtStart(blockElement);
          const hasContent = !isEmpty(blockElement);
          const previousBlock = this.BloxManager?.getPreviousBlock(
            currentBlock.id,
          );

          if (isCursorAtStart && blockElement) {
            event.preventDefault();

            if (hasContent && previousBlock?.id) {
              this.BloxManager?.merge(currentBlock.id);
            } else if (previousBlock?.id) {
              this.DOMManager?.focusBlock(previousBlock.id, true);
              this.BloxManager?.removeById(currentBlock.id);
            }
          }
        }
      }

      if (event.key === "Enter" && event.shiftKey) {
        return;
      }

      if (event.key === "Enter") {
        if (isBlockContext) {
          event.preventDefault();
          if (!blockElement) return;

          const selection = window.getSelection();
          if (!selection || !selection.rangeCount) return;

          const isCursorAtEnd = this.TypingManager?.isCursorAtEnd(blockElement);
          const isCursorAtStart =
            this.TypingManager?.isCursorAtStart(blockElement);

          switch (currentBlock.type) {
            case BLOCK_TYPES.bulletedList:
            case BLOCK_TYPES.numberedList: {
              const currentLi =
                this.TypingManager?.getCursorElementBySelector("li");
              if (!currentLi) return;

              const parentList = currentLi.closest("ul, ol"); // Find the closest list

              if (!parentList) return;

              if (isEmpty(currentLi)) {
                const grandParentList =
                  parentList.parentElement?.closest("ul, ol");

                if (grandParentList) {
                  parentList.removeChild(currentLi);
                  grandParentList.insertBefore(
                    currentLi,
                    parentList.nextSibling,
                  );
                  this.DOMManager?.focusElement(currentLi);
                } else {
                  parentList.removeChild(currentLi);
                  this.BloxManager?.addBlockAfter(
                    currentBlock.id,
                    DEFAULT_BLOCK_TYPE,
                  );
                  if (isEmpty(blockElement))
                    this.BloxManager?.removeById(currentBlock.id);
                  return;
                }
              } else {
                const isCursorAtEnd =
                  this.TypingManager?.isCursorAtEnd(currentLi);
                const isCursorAtStart =
                  this.TypingManager?.isCursorAtStart(currentLi);

                if (isCursorAtEnd) {
                  this.DOMManager?.addElement("li", "after");
                } else if (isCursorAtStart) {
                  this.DOMManager?.addElement("li", "before");
                } else {
                  this.DOMManager?.splitElementBySelector("li");
                }
              }
              return;
            }
            default: {
              if (isCursorAtEnd || isEmpty(blockElement)) {
                this.BloxManager?.addBlockAfter(
                  currentBlock.id,
                  DEFAULT_BLOCK_TYPE,
                );
              } else if (isCursorAtStart) {
                this.BloxManager?.addBlockBefore(
                  currentBlock.id,
                  DEFAULT_BLOCK_TYPE,
                );
              } else {
                this.BloxManager?.split(currentBlock.id);
              }
            }
          }
        }
      }

      if (event.key === "Tab") {
        if (isBlockContext) {
          event.preventDefault();
          if (!blockElement) return;

          const currentLi =
            this.TypingManager?.getCursorElementBySelector("li");
          if (!currentLi) return;

          const parentList = currentLi.closest("ul, ol"); // Detect parent list type
          if (!parentList) return;

          const newNestedList = this.DOMManager?.wrapElement(
            currentLi,
            parentList.tagName,
          );

          if (newNestedList) {
            requestAnimationFrame(() =>
              this.DOMManager?.focusElement(
                newNestedList.querySelector("li"),
                true,
              ),
            );
          }
        }
      }

      if (["ArrowUp", "ArrowDown"].includes(event.key) && isBlockContext) {
        if (!blockElement) return;

        const isAtBoundary =
          event.key === "ArrowUp"
            ? this.TypingManager?.isCursorAtStart(blockElement)
            : this.TypingManager?.isCursorAtEnd(blockElement);

        if (isAtBoundary) {
          const targetBlock =
            event.key === "ArrowUp"
              ? this.BloxManager?.getPreviousBlock(currentBlock.id)
              : this.BloxManager?.getNextBlock(currentBlock.id);

          if (!targetBlock) return;

          event.preventDefault();
          this.DOMManager?.focusBlock(targetBlock.id, event.key === "ArrowUp");
        }
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === "z" || event.key === "y")
      ) {
        const isRedo = event.shiftKey && event.key === "z"; // Shift+Z for redo (or Y for Windows/Linux)
        const currentBlox = this.BloxManager?.getBlox();
        if (!currentBlox) return;

        event.preventDefault();
        const currentState = this.DOMManager?.blocksToHTML(currentBlox);
        if (!currentState) return;

        isRedo
          ? this.HistoryManager?.redo()
          : this.HistoryManager?.undo(currentState);
      }
    };

    window.addEventListener("keydown", this.shortcutHandler);
  }

  unregisterShortcuts(): void {
    if (this.shortcutHandler) {
      window.removeEventListener("keydown", this.shortcutHandler);
      this.shortcutHandler = null;
    }
  }
}
