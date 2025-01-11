import { Blox } from "../classes/Blox";
export declare class DOMManager {
    removeElement: (matchingParent: Element) => void;
    sanitizeHTML: (html: string) => string;
    private isEmptyContent;
    blocksToHTML: (blocks: Blox[]) => string;
    getBlockElementById: (blockId: string) => HTMLElement | null;
    getBlockElement: () => HTMLElement | null;
    focusBlock: (blockId: string, fucusOnEnd?: boolean) => void;
}
