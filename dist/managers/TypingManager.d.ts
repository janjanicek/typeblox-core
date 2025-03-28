import { DOMManager } from "./DOMManager";
export declare class TypingManager {
    private DOMManager;
    lastSelectionData: {
        blockElementId: string | undefined;
        startOffset: number;
        endOffset: number;
        isCursorOnly: boolean;
        startPath?: number[];
        endPath?: number[];
        startNodeOffset?: number;
        endNodeOffset?: number;
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
    /**
     * Saves the current selection state.
     * This method captures the current selection and stores information about it
     * for later restoration, including the block element ID, character offsets,
     * and whether it's a cursor-only selection.
     *
     * It also stores DOM path information to handle cases where the DOM structure
     * changes between saving and restoring the selection.
     */
    saveSelection(): void;
    /**
     * Restores a previously saved selection.
     * This method attempts to restore the selection using multiple strategies:
     * 1. First tries to use DOM paths (most accurate when DOM structure is preserved)
     * 2. Falls back to character offset-based approach if DOM paths fail
     * 3. Has additional fallbacks for edge cases
     *
     * @param justCollapsed - If true, creates the range but doesn't apply it to the selection
     * @returns boolean - Whether the selection was successfully restored
     */
    restoreSelection(justCollapsed?: boolean): boolean;
    /**
     * Gets the DOM path from a node to an ancestor.
     * This creates an array of indices that can be used to navigate from the ancestor to the node.
     *
     * @param node - The node to find the path for
     * @param ancestor - The ancestor to stop at
     * @returns number[] - Array of child indices from ancestor to node
     */
    private getNodePath;
    /**
     * Attempts to restore a selection using DOM paths.
     *
     * @param range - The range to set
     * @param root - The root element to start from
     * @param startPath - Path to the start node
     * @param endPath - Path to the end node
     * @param startOffset - Offset within the start node
     * @param endOffset - Offset within the end node
     * @param isCursorOnly - Whether this is a cursor-only selection
     * @returns boolean - Whether the restoration was successful
     */
    private tryRestoreUsingPaths;
}
