import { BlockType, EventCallback } from "../types";
import { EventEmitter } from "./EventEmitter";
import { TypingManager } from "../managers/TypingManager";
import { StyleManager } from "../managers/StyleManager";
import { PasteManager } from "../managers/PasteManager";
import { DOMManager } from "../managers/DOMManager";
import { HistoryManager } from "../managers/HistoryManager";
interface BloxProps {
    id: string;
    content: string;
    type: BlockType;
    onUpdate: Function;
    TypingManager: TypingManager;
    StyleManager: StyleManager;
    PasteManager: PasteManager;
    HistoryManager: HistoryManager;
    DOMManager: DOMManager;
    style?: string | null;
    classes?: string | null;
    attributes?: string | null;
}
export declare class Blox extends EventEmitter {
    id: string;
    contentElement: HTMLElement | null;
    content: string;
    onUpdate: Function;
    type: BlockType;
    TypingManager: TypingManager;
    StyleManager: StyleManager;
    PasteManager: PasteManager;
    DOMManager: DOMManager;
    HistoryManager: HistoryManager;
    styles: string;
    classes: string;
    attributes: string;
    isSelected: boolean;
    _listeners?: Record<string, EventCallback>;
    constructor({ onUpdate, id, type, content, TypingManager, StyleManager: FormatManager, HistoryManager, PasteManager, DOMManager, style, classes, attributes, }: BloxProps);
    getContentElement(): HTMLElement | null;
    getImageURL(): string;
    getVideoURL(): string;
    updateContent: () => boolean;
    getContent: () => string;
    isContentEmpty: () => boolean;
    setContent: (contentString: string) => void;
    private executeWithCallbacks;
    private beforeToggle;
    private afterToggle;
    toggleBold(): boolean;
    toggleItalic(): boolean;
    toggleStrike(): boolean;
    toggleUnderline(): boolean;
    clearStyle(): void;
    applyStyle(tagName: string, style: Record<string, string>): void;
    toggleType(newType: BlockType): void;
    clearDefaults(): void;
    applyDefaults(): void;
    private isListType;
    private shouldClearContent;
    pasteContent(e: ClipboardEvent): void;
    getStyles(stylesString?: string): Record<string, string>;
    setStyle(property: string, value: string): void;
    setStyles(styles: Record<string, string>): void;
    removeStyle(property: string): void;
    clearStyles(): void;
    getClasses(classesString?: string): string[];
    addClass(className: string): void;
    removeClass(className: string): void;
    hasClass(className: string): boolean;
    clearClasses(): void;
    toggleStyle(property: string, value: string): void;
    toggleClass(className: string): void;
    getAttributes(attributesString?: string): Record<string, string>;
    setAttribute(attribute: string, value: string): void;
    setAttributes(attributes: Record<string, string>): void;
    removeAttribute(attribute: string): void;
    clearAttributes(): void;
    setIsSelected(isSelected: boolean): void;
    sendUpdateStyleEvent(): void;
    sendUpdateBloxEvent(): void;
}
export {};
