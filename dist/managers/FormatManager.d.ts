import type { TypingManager } from "./TypingManager";
import { detectedStyles } from "../types";
import { DOMManager } from "./DOMManager";
export declare class FormatManager {
    private TypingManager;
    private DOMManager;
    constructor(TypingManager: TypingManager, DOMManager: DOMManager);
    applyFormat(tagName: string, style?: Record<string, string>): void;
    unapplyFormat(tagName: string, styleKey?: string | null): void;
    unapplyAliases(tagName: string): void;
    getStyle: () => detectedStyles;
    clearFormat: (element?: HTMLElement) => void;
}
