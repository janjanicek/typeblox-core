import { Blox } from "../classes/Blox";
import type { BloxManager } from "./BloxManager";
import { TypingManager } from "./TypingManager";
import { EditorManager } from "./EditorManager";
import { LinkManager } from "./LinkManager";
export declare class DOMManager {
    private BloxManager;
    private TypingManager;
    private EditorManager;
    private LinkManager;
    constructor(initialBloxManager?: BloxManager, initialTypingManager?: TypingManager, initialEditorManager?: EditorManager, initialLinkManager?: LinkManager);
    setDependencies(BloxManager: BloxManager, TypingManager: TypingManager, EditorManager: EditorManager, LinkManager: LinkManager): void;
    removeElement: (matchingParent: Element) => void;
    sanitizeHTML: (html: string) => string;
    private isEmptyContent;
    blocksToHTML: (blocks: Blox[]) => string;
    getBlockElementById: (blockId: string) => HTMLElement | null;
    getBlockElement: () => HTMLElement | null;
    getBlockFromEvent(event: Event): Blox | null;
    focusBlock: (blockId: string, focusOnEnd?: boolean) => void;
    focusElement: (element: HTMLElement | null, focusOnEnd?: boolean) => void;
    getCurrentDOM: () => string;
    parseHTMLToBlocks: (htmlString: string) => Blox[];
    private getFinalElement;
    splitElementBySelector(selector: string): void;
    addElement(selector: string, position?: "before" | "after"): HTMLElement;
    wrapElement(targetElement: HTMLElement, wrapperTag: string): HTMLElement | null;
}
