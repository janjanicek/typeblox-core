import { DOMManager } from "./DOMManager";
export declare class TypingManager {
    private DOMManager;
    lastSelectionData: {
        blockElementId: string | undefined;
        startOffset: number;
        endOffset: number;
        isCursorOnly: boolean;
    } | null;
    setDependencies(DOMManager: DOMManager): void;
    mergeConsecutiveStyledElements(blockElement: HTMLElement): void;
    getCursorElement(): Node | null;
    getCursorElementBySelector(selector: string): HTMLElement | null;
    removeSelection(): void;
    isCursorAtStart(container: HTMLElement): boolean;
    isCursorAtEnd(container: HTMLElement): boolean;
    getFirstMeaningfulNode(container: HTMLElement): Node | null;
    getLastMeaningfulNode(container: HTMLElement): Node | null;
    hasTextSelection(): boolean;
    getSelectedElement(): Element | null;
    saveSelection(): void;
    restoreSelection(justCollapsed?: boolean): void;
}
