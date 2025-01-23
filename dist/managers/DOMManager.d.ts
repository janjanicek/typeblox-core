import { Blox } from "../classes/Blox";
import type { BloxManager } from "./BloxManager";
export declare class DOMManager {
    private BloxManager;
    constructor(initialBloxManager?: BloxManager);
    setDependencies(BloxManager: BloxManager): void;
    removeElement: (matchingParent: Element) => void;
    sanitizeHTML: (html: string) => string;
    private isEmptyContent;
    blocksToHTML: (blocks: Blox[]) => string;
    getBlockElementById: (blockId: string) => HTMLElement | null;
    getBlockElement: () => HTMLElement | null;
    focusBlock: (blockId: string, focusOnEnd?: boolean) => void;
    parseHTMLToBlocks: (htmlString: string) => Blox[];
}
