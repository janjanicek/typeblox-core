import type { TypingManager } from "./TypingManager";
import { detectedStyles } from "../types";
import { DOMManager } from "./DOMManager";
import { EventEmitter } from "../classes/EventEmitter";
import type { Blox } from "../classes/Blox";
import { LinkManager } from "./LinkManager";
export declare class StyleManager extends EventEmitter {
    private TypingManager;
    private DOMManager;
    private LinkManager;
    private currentStyles;
    constructor();
    setDependencies(DOMManager: DOMManager, TypingManager: TypingManager, LinkManager: LinkManager): void;
    private areDependenciesSet;
    /**
     * Applies formatting to the selected text.
     * This method handles various scenarios including:
     * - Applying formatting to a text selection
     * - Handling nested formatting
     * - Applying styles to existing formatted elements
     * - Handling complex DOM structures
     *
     * @param tagName - The HTML tag to apply (e.g., 'strong', 'em', 'u')
     * @param style - Optional styles to apply to the element
     * @returns boolean - Whether the formatting was applied successfully
     */
    applyFormat(tagName: string, style?: Record<string, string>): boolean;
    /**
     * Removes formatting from the selected text.
     * This method handles various scenarios including:
     * - Removing formatting from a text selection
     * - Handling nested formatting
     * - Removing styles from formatted elements
     *
     * @param tagName - The HTML tag to remove (e.g., 'strong', 'em', 'u')
     * @param styleKey - Optional style property to remove
     * @returns boolean - Whether the formatting was removed successfully
     */
    unapplyFormat(tagName: string, styleKey?: string | null): boolean;
    unapplyAliases(tagName: string): void;
    getStyle: () => detectedStyles;
    clearFormat: (element?: HTMLElement) => void;
    updateCurrentStyles(block: Blox): void;
}
