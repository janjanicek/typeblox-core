import { EventEmitter } from "./EventEmitter";
import { BLOCKS_SETTINGS, BLOCK_TYPES, EVENTS } from "../constants";
import { convertToCamelCase } from "../utils/css";
import { isEmpty } from "../utils/elements";
export class Blox extends EventEmitter {
    constructor({ onUpdate, id, type, content, TypingManager, StyleManager: FormatManager, HistoryManager, PasteManager, DOMManager, style, classes, attributes, }) {
        super();
        this.updateContent = () => {
            var _a;
            const liveElement = this.getContentElement();
            this.contentElement = liveElement;
            if (this.type === BLOCK_TYPES.image) {
                // Special handling for images
                const imageURL = this.getImageURL();
                const isSame = imageURL === this.content; // Compare the current content with the image URL
                this.content = isSame ? this.content : imageURL;
                return !isSame; // Return whether the content has changed
            }
            // Default handling for other types
            const isSame = (liveElement === null || liveElement === void 0 ? void 0 : liveElement.innerHTML) === this.content;
            this.content = isSame ? this.content : ((_a = liveElement === null || liveElement === void 0 ? void 0 : liveElement.innerHTML) !== null && _a !== void 0 ? _a : "");
            return !isSame; // Return whether the content has changed
        };
        this.getContent = () => {
            this.updateContent();
            return `<${BLOCKS_SETTINGS[this.type].tag}>${this.content}</${BLOCKS_SETTINGS[this.type].tag}>`;
        };
        this.isContentEmpty = () => /^[\s\u00A0\u200B]*$/.test(this.content);
        this.setContent = (contentString) => {
            if (this.type === BLOCK_TYPES.image) {
                // If it's an image, set `src` instead of `innerHTML`
                this.content = contentString; // Store the raw image URL
                if (this.contentElement instanceof HTMLImageElement) {
                    this.contentElement.src = this.content;
                }
            }
            else {
                // For other block types, parse the HTML normally
                const parser = new DOMParser();
                const doc = parser.parseFromString(contentString, "text/html");
                const wrapperTag = BLOCKS_SETTINGS[this.type].tag;
                const wrapperElement = doc.body.querySelector(wrapperTag);
                this.content = wrapperElement ? wrapperElement.innerHTML : contentString;
                if (this.contentElement) {
                    this.contentElement.innerHTML = this.content;
                }
            }
            this.sendUpdateBloxEvent();
        };
        this.id = id !== null && id !== void 0 ? id : Date.now().toString();
        this.content = content;
        this.TypingManager = TypingManager;
        this.StyleManager = FormatManager;
        this.PasteManager = PasteManager;
        this.HistoryManager = HistoryManager;
        this.DOMManager = DOMManager;
        this.contentElement = this.getContentElement();
        this.onUpdate = onUpdate;
        this.type = type !== null && type !== void 0 ? type : "text";
        this.styles = style !== null && style !== void 0 ? style : "";
        this.classes = classes !== null && classes !== void 0 ? classes : "";
        this.attributes = attributes !== null && attributes !== void 0 ? attributes : "";
        this.isSelected = false;
    }
    getContentElement() {
        return document.querySelector(`[data-typeblox-id="${this.id}"]`);
    }
    getImageURL() {
        var _a, _b;
        return ((_b = (_a = document
            .querySelector(`[data-typeblox-id="${this.id}"] img`)) === null || _a === void 0 ? void 0 : _a.getAttribute("src")) !== null && _b !== void 0 ? _b : "");
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
        this.sendUpdateStyleEvent();
    }
    toggleBold() {
        return this.executeWithCallbacks(() => {
            const { isBold } = this.StyleManager.getStyle();
            if (document.queryCommandSupported("bold")) {
                document.execCommand("bold");
            }
            else {
                !isBold
                    ? this.StyleManager.applyFormat("strong")
                    : this.StyleManager.unapplyFormat("strong");
            }
            return !isBold;
        });
    }
    toggleItalic() {
        return this.executeWithCallbacks(() => {
            const { isItalic } = this.StyleManager.getStyle();
            if (document.queryCommandSupported("italic")) {
                document.execCommand("italic");
            }
            else {
                !isItalic
                    ? this.StyleManager.applyFormat("i")
                    : this.StyleManager.unapplyFormat("i");
            }
            return !isItalic;
        });
    }
    toggleStrike() {
        return this.executeWithCallbacks(() => {
            const { isStrikeout } = this.StyleManager.getStyle();
            if (document.queryCommandSupported("strikeThrough")) {
                document.execCommand("strikeThrough");
            }
            else {
                !isStrikeout
                    ? this.StyleManager.applyFormat("s")
                    : this.StyleManager.unapplyFormat("s");
            }
            return !isStrikeout;
        });
    }
    toggleUnderline() {
        return this.executeWithCallbacks(() => {
            const { isUnderline } = this.StyleManager.getStyle();
            if (document.queryCommandSupported("underline")) {
                document.execCommand("underline");
            }
            else {
                !isUnderline
                    ? this.StyleManager.applyFormat("u")
                    : this.StyleManager.unapplyFormat("u");
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
                this.StyleManager.clearFormat();
            }
        });
    }
    applyStyle(tagName, style) {
        this.executeWithCallbacks(() => {
            this.StyleManager.applyFormat(tagName, style);
        });
    }
    toggleType(newType) {
        if (this.type === newType)
            return; // No change needed
        const wasList = this.isListType(this.type);
        this.type = newType;
        if (!wasList && this.isListType(newType)) {
            this.content = BLOCKS_SETTINGS[newType].contentPattern(this.content);
        }
        if (this.shouldClearContent(newType)) {
            this.content = newType === BLOCK_TYPES.code ? "\u200B" : "";
        }
        this.sendUpdateBloxEvent();
        requestAnimationFrame(() => {
            var _a;
            (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.focusElement(this.getContentElement());
        });
    }
    // Utility methods for better readability
    isListType(type) {
        return (type === BLOCK_TYPES.numberedList || type === BLOCK_TYPES.bulletedList);
    }
    shouldClearContent(type) {
        const contentElement = this.getContentElement();
        return (!contentElement ||
            isEmpty(contentElement) ||
            this.content.trim() === "/" ||
            type === BLOCK_TYPES.code ||
            type === BLOCK_TYPES.image);
    }
    pasteContent(e) {
        this.PasteManager.pasteContent(e);
        this.sendUpdateBloxEvent();
    }
    // Getter for styles
    getStyles() {
        const styleMap = {};
        this.styles
            .split(";")
            .map((style) => style.trim())
            .filter((style) => style.length > 0)
            .forEach((style) => {
            const [property, value] = style.split(":").map((s) => s.trim());
            if (property && value) {
                styleMap[convertToCamelCase(property)] = value;
            }
        });
        return styleMap;
    }
    // Setter for a single style
    setStyle(property, value) {
        const styles = this.getStyles();
        // Use raw property names for proper CSS handling
        const normalizedProperty = property.trim();
        styles[normalizedProperty] = value;
        // Convert styles back into a semicolon-separated string
        this.styles = Object.entries(styles)
            .map(([key, val]) => `${key}: ${val}`)
            .join("; ");
        this.sendUpdateBloxEvent();
    }
    // Setter for multiple styles
    setStyles(styles) {
        // Parse the existing styles into a Record
        const currentStyles = this.getStyles();
        // Merge the new styles into the current styles
        Object.entries(styles).forEach(([property, value]) => {
            const normalizedProperty = property.trim();
            currentStyles[normalizedProperty] = value;
        });
        // Convert the updated styles back to a string
        this.styles = Object.entries(currentStyles)
            .map(([key, value]) => `${key}: ${value}`)
            .join("; ");
        this.sendUpdateBloxEvent();
    }
    // Remove a specific style
    removeStyle(property) {
        const styles = this.getStyles();
        delete styles[convertToCamelCase(property)];
        this.styles = Object.entries(styles)
            .map(([key, val]) => `${key}: ${val}`)
            .join("; ");
        this.sendUpdateBloxEvent();
    }
    // Clear all styles
    clearStyles() {
        this.styles = "";
        this.sendUpdateBloxEvent();
    }
    // Getter for classes
    getClasses() {
        return this.classes.split(" ").filter((cls) => cls.trim());
    }
    // Add a class
    addClass(className) {
        const classList = new Set(this.getClasses());
        classList.add(className);
        this.classes = Array.from(classList).join(" ");
        this.sendUpdateStyleEvent();
    }
    // Remove a class
    removeClass(className) {
        const classList = new Set(this.getClasses());
        classList.delete(className);
        this.classes = Array.from(classList).join(" ");
        this.sendUpdateStyleEvent();
    }
    // Check if a class exists
    hasClass(className) {
        return this.getClasses().includes(className);
    }
    // Clear all classes
    clearClasses() {
        this.classes = "";
        this.sendUpdateStyleEvent();
    }
    // Toggle a style
    toggleStyle(property, value) {
        const styles = this.getStyles(); // Parse styles into a Record
        const camelCaseProperty = convertToCamelCase(property); // Convert property to camelCase
        if (styles[camelCaseProperty] === value) {
            // If the property has the given value, remove it
            this.removeStyle(property);
        }
        else {
            // Otherwise, set the property to the given value
            this.setStyle(property, value);
        }
        this.sendUpdateStyleEvent();
    }
    // Toggle a class
    toggleClass(className) {
        const classList = new Set(this.getClasses());
        if (classList.has(className)) {
            classList.delete(className);
        }
        else {
            classList.add(className);
        }
        this.classes = Array.from(classList).join(" ");
        this.sendUpdateStyleEvent();
    }
    // Getter for attributes
    getAttributes() {
        const attributesMap = {};
        this.attributes
            .split(";")
            .map((attr) => attr.trim())
            .filter((attr) => attr.length > 0)
            .forEach((attr) => {
            const [key, value] = attr.split("=").map((s) => s.trim());
            if (key && value) {
                attributesMap[key] = value.replace(/^"|"$/g, ""); // Remove quotes around the value
            }
        });
        return attributesMap;
    }
    // Setter for a single attribute
    setAttribute(attribute, value) {
        const attributes = this.getAttributes();
        attributes[attribute.trim()] = value.trim();
        // Convert attributes back to a semicolon-separated string
        this.attributes = Object.entries(attributes)
            .map(([key, val]) => `${key}="${val}"`)
            .join("; ");
        this.sendUpdateBloxEvent();
    }
    // Setter for multiple attributes
    setAttributes(attributes) {
        const currentAttributes = this.getAttributes();
        // Merge new attributes into the existing ones
        Object.entries(attributes).forEach(([key, value]) => {
            currentAttributes[key.trim()] = value.trim();
        });
        // Convert the updated attributes back to a string
        this.attributes = Object.entries(currentAttributes)
            .map(([key, val]) => `${key}="${val}"`)
            .join("; ");
        this.sendUpdateBloxEvent();
    }
    // Remove a specific attribute
    removeAttribute(attribute) {
        const attributes = this.getAttributes();
        delete attributes[attribute.trim()];
        this.attributes = Object.entries(attributes)
            .map(([key, val]) => `${key}="${val}"`)
            .join("; ");
        this.sendUpdateBloxEvent();
    }
    // Clear all attributes
    clearAttributes() {
        this.attributes = "";
        this.sendUpdateBloxEvent();
    }
    setIsSelected(isSelected) {
        this.isSelected = isSelected;
        this.sendUpdateBloxEvent();
    }
    sendUpdateStyleEvent() {
        var _a;
        this.updateContent();
        (_a = this.HistoryManager) === null || _a === void 0 ? void 0 : _a.saveState();
        this.emit(EVENTS.styleChange);
    }
    sendUpdateBloxEvent() {
        this.emit(EVENTS.blocksChanged);
    }
}
