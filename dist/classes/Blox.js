import { EventEmitter } from "./EventEmitter";
import { BLOCKS_SETTINGS, EVENTS } from "../constants";
export class Blox extends EventEmitter {
    constructor({ onUpdate, id, type, content, TypingManager, FormatManager, PasteManager, }) {
        super();
        this.updateContent = () => {
            var _a, _b;
            this.contentElement = this.getContentElement();
            this.content = (_b = (_a = this.getContentElement()) === null || _a === void 0 ? void 0 : _a.innerHTML) !== null && _b !== void 0 ? _b : "";
        };
        this.getContent = () => {
            this.updateContent();
            return `<${BLOCKS_SETTINGS[this.type].tag}>${this.content}</${BLOCKS_SETTINGS[this.type].tag}>`;
        };
        this.setContent = (contentString) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(contentString, "text/html");
            const wrapperTag = BLOCKS_SETTINGS[this.type].tag;
            const wrapperElement = doc.body.querySelector(wrapperTag);
            console.log("setContent", wrapperElement);
            if (wrapperElement) {
                this.content = wrapperElement.innerHTML;
            }
            else {
                this.content = contentString;
            }
            if (this.contentElement) {
                this.contentElement.innerHTML = this.content;
            }
            this.emit(EVENTS.blocksChanged);
        };
        this.id = id !== null && id !== void 0 ? id : Date.now().toString();
        this.content = content;
        this.TypingManager = TypingManager;
        this.FormatManager = FormatManager;
        this.PasteManager = PasteManager;
        this.contentElement = this.getContentElement();
        this.onUpdate = onUpdate;
        this.type = type !== null && type !== void 0 ? type : "text";
    }
    getContentElement() {
        return document.querySelector(`[data-typeblox-id="${this.id}"]`);
    }
    executeWithCallbacks(callback) {
        this.beforeToggle();
        const result = callback();
        this.afterToggle();
        return result;
    }
    beforeToggle() {
        this.TypingManager.saveSelectionRange();
        this.TypingManager.restoreSelectionRange();
    }
    afterToggle() {
        this.TypingManager.selectAllTextInSelectedElement();
        this.emit(EVENTS.styleChange);
    }
    toggleBold() {
        return this.executeWithCallbacks(() => {
            const { isBold } = this.FormatManager.getStyle();
            if (document.queryCommandSupported("bold")) {
                document.execCommand("bold");
            }
            else {
                !isBold
                    ? this.FormatManager.applyFormat("strong")
                    : this.FormatManager.unapplyFormat("strong");
            }
            return !isBold;
        });
    }
    toggleItalic() {
        return this.executeWithCallbacks(() => {
            const { isItalic } = this.FormatManager.getStyle();
            if (document.queryCommandSupported("italic")) {
                document.execCommand("italic");
            }
            else {
                !isItalic
                    ? this.FormatManager.applyFormat("i")
                    : this.FormatManager.unapplyFormat("i");
            }
            return !isItalic;
        });
    }
    toggleStrike() {
        return this.executeWithCallbacks(() => {
            const { isStrikeout } = this.FormatManager.getStyle();
            if (document.queryCommandSupported("strikeThrough")) {
                document.execCommand("strikeThrough");
            }
            else {
                !isStrikeout
                    ? this.FormatManager.applyFormat("s")
                    : this.FormatManager.unapplyFormat("s");
            }
            return !isStrikeout;
        });
    }
    toggleUnderline() {
        return this.executeWithCallbacks(() => {
            const { isUnderline } = this.FormatManager.getStyle();
            if (document.queryCommandSupported("underline")) {
                document.execCommand("underline");
            }
            else {
                !isUnderline
                    ? this.FormatManager.applyFormat("u")
                    : this.FormatManager.unapplyFormat("u");
            }
            return !isUnderline;
        });
    }
    clearStyle() {
        return this.executeWithCallbacks(() => {
            if (document.queryCommandSupported("removeFormat")) {
                document.execCommand("removeFormat");
                console.warn("removeFormat");
            }
            else {
                this.FormatManager.clearFormat();
            }
        });
    }
    applyStyle(tagName, style) {
        this.executeWithCallbacks(() => {
            this.FormatManager.applyFormat(tagName, style);
        });
    }
    toggleType(newType) {
        this.type = newType === this.type ? "text" : newType;
        this.emit(EVENTS.blocksChanged);
        this.emit(EVENTS.styleChange);
        setTimeout(() => this.TypingManager.selectAllTextInSelectedElement(), 50);
    }
    pasteContent(e) {
        this.PasteManager.pasteContent(e);
        this.emit(EVENTS.blocksChanged);
    }
}
