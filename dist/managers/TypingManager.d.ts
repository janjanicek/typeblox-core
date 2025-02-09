export declare class TypingManager {
    private lastRange;
    saveSelectionRange(): null | undefined;
    restoreSelectionRange(): void;
    mergeConsecutiveStyledElements(blockElement: HTMLElement): void;
    createSelectedElement(range?: Range): void;
    getSelectedElement(wrapper?: Element | Document): HTMLElement | null;
    getCursorElement(): Node | null;
    getCursorElementBySelector(selector: string): HTMLElement | null;
    selectAllTextInSelectedElement(): void;
    removeSelection(blockElement: HTMLElement | null): void;
    isCursorAtStart(container: HTMLElement): boolean;
    isCursorAtEnd(container: HTMLElement): boolean;
    getFirstMeaningfulNode(container: HTMLElement): Node | null;
    getLastMeaningfulNode(container: HTMLElement): Node | null;
}
