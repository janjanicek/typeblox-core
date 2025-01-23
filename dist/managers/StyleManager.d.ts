import type { TypingManager } from "./TypingManager";
import { detectedStyles } from "../types";
import { DOMManager } from "./DOMManager";
import { EventEmitter } from "../classes/EventEmitter";
import type { Blox } from "../classes/Blox";
export declare class StyleManager extends EventEmitter {
    private TypingManager;
    private DOMManager;
    private currentStyles;
    constructor();
    setDependencies(DOMManager: DOMManager, TypingManager: TypingManager): void;
    private areDependenciesSet;
    applyFormat(tagName: string, style?: Record<string, string>): void;
    unapplyFormat(tagName: string, styleKey?: string | null): void;
    unapplyAliases(tagName: string): void;
    getStyle: () => detectedStyles;
    clearFormat: (element?: HTMLElement) => void;
    updateCurrentStyles(block: Blox): void;
}
