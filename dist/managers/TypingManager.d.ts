import { DOMManager } from "./DOMManager";
import { EventEmitter } from "../classes/EventEmitter";
export interface SelectionData {
    blockElementId: string | undefined;
    startOffset: number;
    endOffset: number;
    isCursorOnly: boolean;
    startPath?: number[];
    endPath?: number[];
    startNodeOffset?: number;
    endNodeOffset?: number;
}
export declare class TypingManager extends EventEmitter {
    private DOMManager;
    lastSelectionData: SelectionData | null;
    private _prevSelectionKey;
    private _onNativeSelectionChange;
    constructor();
    destroy(): void;
    setDependencies(DOMManager: DOMManager): void;
    mergeConsecutiveStyledElements(blockElement: HTMLElement): void;
    private _makeSelectionKey;
    private _checkSelectionChange;
    protected handleSelectionChange(): void;
    getCursorElement(): HTMLElement | null;
    getCursorElementBySelector(selector: string): HTMLElement | null;
    removeSelection(): void;
    isCursorAtStart(container: HTMLElement): boolean;
    isCursorAtEnd(container: HTMLElement): boolean;
    getFirstMeaningfulNode(container: HTMLElement): Node | null;
    getLastMeaningfulNode(container: HTMLElement): Node | null;
    hasTextSelection(): boolean;
    getSelectedElement(): Element | null;
    saveSelection(): void;
    restoreSelection(justCollapsed?: boolean): boolean;
    private getNodePath;
    private tryRestoreUsingPaths;
}
