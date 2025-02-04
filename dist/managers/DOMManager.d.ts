import { Blox } from "../classes/Blox";
import type { BloxManager } from "./BloxManager";
import { TypingManager } from "./TypingManager";
export declare class DOMManager {
    private BloxManager;
    private TypingManager;
    constructor(initialBloxManager?: BloxManager, initialTypingManager?: TypingManager);
    setDependencies(BloxManager: BloxManager, TypingManager: TypingManager): void;
    removeElement: (matchingParent: Element) => void;
    sanitizeHTML: (html: string) => string;
    private isEmptyContent;
    blocksToHTML: (blocks: Blox[]) => string;
    getBlockElementById: (blockId: string) => HTMLElement | null;
    getBlockElement: () => HTMLElement | null;
    getBlockFromEvent(event: Event): Blox | null;
    focusBlock: (blockId: string, focusOnEnd?: boolean) => void;
    focusElement: (element: HTMLElement | null, focusOnEnd?: boolean) => void;
    parseHTMLToBlocks: (htmlString: string) => Blox[];
    private getFinalElement;
    splitElementBySelector(selector: string): void;
    addElement(selector: string, position?: "before" | "after"): HTMLElement;
    wrapElement(targetElement: HTMLElement, wrapperTag: string): HTMLElement | null;
}
