import { EventEmitter } from "./EventEmitter";
import { BLOCKS_SETTINGS, EVENTS } from "../constants";
import { convertToCamelCase } from "../utils/css";
export class Blox extends EventEmitter {
    constructor({ onUpdate, id, type, content, TypingManager, StyleManager: FormatManager, PasteManager, style, classes, attributes, }) {
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
        this.StyleManager = FormatManager;
        this.PasteManager = PasteManager;
        this.contentElement = this.getContentElement();
        this.onUpdate = onUpdate;
        this.type = type !== null && type !== void 0 ? type : "text";
        this.styles = style !== null && style !== void 0 ? style : "";
        this.classes = classes !== null && classes !== void 0 ? classes : "";
        this.attributes = attributes !== null && attributes !== void 0 ? attributes : "";
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
        this.type = newType === this.type ? "text" : newType;
        this.emit(EVENTS.blocksChanged);
        this.emit(EVENTS.styleChange);
        setTimeout(() => this.TypingManager.selectAllTextInSelectedElement(), 50);
    }
    pasteContent(e) {
        this.PasteManager.pasteContent(e);
        this.emit(EVENTS.blocksChanged);
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
        this.emit(EVENTS.styleChange);
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
        // Emit style change event
        this.emit(EVENTS.styleChange);
    }
    // Remove a specific style
    removeStyle(property) {
        const styles = this.getStyles();
        delete styles[convertToCamelCase(property)];
        this.styles = Object.entries(styles)
            .map(([key, val]) => `${key}: ${val}`)
            .join("; ");
        this.emit(EVENTS.styleChange);
    }
    // Clear all styles
    clearStyles() {
        this.styles = "";
        this.emit(EVENTS.styleChange);
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
        this.emit(EVENTS.styleChange);
    }
    // Remove a class
    removeClass(className) {
        const classList = new Set(this.getClasses());
        classList.delete(className);
        this.classes = Array.from(classList).join(" ");
        this.emit(EVENTS.styleChange);
    }
    // Check if a class exists
    hasClass(className) {
        return this.getClasses().includes(className);
    }
    // Clear all classes
    clearClasses() {
        this.classes = "";
        this.emit(EVENTS.styleChange);
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
        this.emit(EVENTS.styleChange); // Emit the style change event
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
        this.emit(EVENTS.styleChange);
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
        this.emit(EVENTS.styleChange);
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
        this.emit(EVENTS.styleChange);
    }
    // Remove a specific attribute
    removeAttribute(attribute) {
        const attributes = this.getAttributes();
        delete attributes[attribute.trim()];
        this.attributes = Object.entries(attributes)
            .map(([key, val]) => `${key}="${val}"`)
            .join("; ");
        this.emit(EVENTS.styleChange);
    }
    // Clear all attributes
    clearAttributes() {
        this.attributes = "";
        this.emit(EVENTS.styleChange);
    }
}
