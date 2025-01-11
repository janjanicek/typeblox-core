import { BlockType } from "../types";
import { EventEmitter } from "./EventEmitter";
import { TypingManager } from "../managers/TypingManager";
import { FormatManager } from "../managers/FormatManager";
import { PasteManager } from "../managers/PasteManager";
interface BloxProps {
    id: string;
    content: string;
    type: BlockType;
    onUpdate: Function;
    TypingManager: TypingManager;
    FormatManager: FormatManager;
    PasteManager: PasteManager;
}
export declare class Blox extends EventEmitter {
    id: string;
    contentElement: HTMLElement | null;
    content: string;
    onUpdate: Function;
    type: BlockType;
    TypingManager: TypingManager;
    FormatManager: FormatManager;
    PasteManager: PasteManager;
    constructor({ onUpdate, id, type, content, TypingManager, FormatManager, PasteManager, }: BloxProps);
    getContentElement(): HTMLElement | null;
    updateContent: () => void;
    getContent: () => string;
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
    pasteContent(e: ClipboardEvent): void;
}
export {};
