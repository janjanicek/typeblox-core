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
    applyFormat(tagName: string, style?: Record<string, string>): void;
    unapplyFormat(tagName: string, styleKey?: string | null): void;
    unapplyAliases(tagName: string): void;
    getStyle: () => detectedStyles;
    clearFormat: (element?: HTMLElement) => void;
    updateCurrentStyles(block: Blox): void;
}
