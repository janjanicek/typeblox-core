export declare class TypingManager {
    private lastRange;
    private lastRangeElement;
    saveSelectionRange(): null | undefined;
    restoreSelectionRange(): void;
    mergeConsecutiveStyledElements(blockElement: HTMLElement): void;
    createSelectedElement(range?: Range): void;
    getSelectedElement(wrapper?: Element | Document): HTMLElement | null;
    getCursorElement(): Node | null;
    selectAllTextInSelectedElement(): void;
    removeSelection(blockElement: HTMLElement | null): void;
}
