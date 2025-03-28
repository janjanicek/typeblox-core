import { EventEmitter } from "./EventEmitter";
import { EVENTS } from "../constants";
import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../blockTypes";
import { convertToCamelCase } from "../utils/css";
import { isEmpty } from "../utils/elements";
export class Blox extends EventEmitter {
    constructor({ onUpdate, id, type, content, TypingManager, StyleManager: FormatManager, HistoryManager, PasteManager, DOMManager, style, classes, attributes, }) {
        var _a, _b, _c;
        super();
        this.updateContent = () => {
            var _a;
            const liveElement = this.getContentElement();
            const clonedElement = liveElement === null || liveElement === void 0 ? void 0 : liveElement.cloneNode(true);
            this.contentElement = liveElement;
            if (this.type === BLOCK_TYPES.image) {
                // Special handling for images
                const imageURL = this.getImageURL();
                const isSame = imageURL === this.content; // Compare the current content with the image URL
                this.content = isSame ? this.content : imageURL;
                return !isSame; // Return whether the content has changed
            }
            if (this.type === BLOCK_TYPES.video) {
                // Special handling for images
                const videoURL = this.getVideoURL();
                const isSame = videoURL === this.content; // Compare the current content with the image URL
                this.content = isSame ? this.content : videoURL;
                return !isSame; // Return whether the content has changed
            }
            // Default handling for other types
            const isSame = (clonedElement === null || clonedElement === void 0 ? void 0 : clonedElement.innerHTML) === this.content;
            this.content = isSame ? this.content : ((_a = clonedElement === null || clonedElement === void 0 ? void 0 : clonedElement.innerHTML) !== null && _a !== void 0 ? _a : "");
            return !isSame; // Return whether the content has changed
        };
        this.getContent = () => {
            this.updateContent();
            return this.content;
        };
        this.isContentEmpty = () => /^[\s\u00A0\u200B]*$/.test(this.content);
        this.setContent = (contentString) => {
            if (this.type === BLOCK_TYPES.image || this.type === BLOCK_TYPES.video) {
                this.content = contentString; // Store the raw image URL
                if (this.contentElement instanceof HTMLImageElement) {
                    this.contentElement.src = this.content;
                }
                if (this.contentElement instanceof HTMLIFrameElement) {
                    this.contentElement.src = this.content;
                }
            }
            else {
                const parser = new DOMParser();
                const doc = parser.parseFromString(contentString, "text/html");
                this.content = doc.body.innerHTML;
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
        const defaultStyles = (_a = BLOCKS_SETTINGS[this.type].defaults.styles) !== null && _a !== void 0 ? _a : "";
        const defaultClasses = (_b = BLOCKS_SETTINGS[this.type].defaults.classes) !== null && _b !== void 0 ? _b : "";
        const defaultAttributes = (_c = BLOCKS_SETTINGS[this.type].defaults.attributes) !== null && _c !== void 0 ? _c : "";
        this.styles = style ? `${style} ${defaultStyles}` : defaultStyles;
        this.classes = classes ? `${classes} ${defaultClasses}` : defaultClasses;
        this.attributes = attributes
            ? `${attributes} ${defaultAttributes}`
            : defaultAttributes;
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
    getVideoURL() {
        var _a, _b;
        return ((_b = (_a = document
            .querySelector(`[data-typeblox-id="${this.id}"] iframe`)) === null || _a === void 0 ? void 0 : _a.getAttribute("src")) !== null && _b !== void 0 ? _b : "");
    }
    executeWithCallbacks(callback) {
        this.beforeToggle();
        const result = callback();
        this.afterToggle();
        return result;
    }
    beforeToggle() {
        this.TypingManager.saveSelection();
    }
    afterToggle() {
        requestAnimationFrame(() => {
            // Remove the 'true' parameter to fully restore the selection without collapsing it
            this.TypingManager.restoreSelection();
            this.sendUpdateStyleEvent();
        });
    }
    toggleBold() {
        return this.executeWithCallbacks(() => {
            console.log("toggleBold");
            const { isBold } = this.StyleManager.getStyle();
            if (document.queryCommandSupported("bold")) {
                document.execCommand("bold");
            }
            else {
                console.warn("toggleBold");
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
                this.StyleManager.unapplyFormat("mark"); // mark element can't be removed by execCommand
            }
            else {
                this.StyleManager.clearFormat();
            }
        });
    }
    applyStyle(tagName, style) {
        this.executeWithCallbacks(() => {
            if (document.queryCommandSupported("styleWithCSS")) {
                document.execCommand("styleWithCSS", false, "true");
                if (style.backgroundColor) {
                    document.execCommand("backColor", false, style.backgroundColor);
                }
                if (style.color) {
                    document.execCommand("foreColor", false, style.color);
                }
                if (style.fontFamily) {
                    document.execCommand("fontName", false, style.fontFamily);
                }
            }
            else {
                this.StyleManager.applyFormat(tagName, style);
            }
        });
    }
    toggleType(newType) {
        if (this.type === newType)
            return; // No change needed
        const wasList = this.isListType(this.type);
        this.clearDefaults(); // removed old type defaults
        this.type = newType;
        this.applyDefaults(); // apply new type default
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
    clearDefaults() {
        if (BLOCKS_SETTINGS[this.type].defaults.styles) {
            const defaultStyles = this.getStyles(BLOCKS_SETTINGS[this.type].defaults.styles);
            Object.entries(defaultStyles).forEach(([key, value]) => {
                if (this.getStyles()[key] === value) {
                    this.removeStyle(key);
                }
            });
        }
        if (BLOCKS_SETTINGS[this.type].defaults.attributes) {
            const defaultAttributes = this.getAttributes(BLOCKS_SETTINGS[this.type].defaults.attributes);
            Object.entries(defaultAttributes).forEach(([key, value]) => {
                if (this.getAttributes()[key] === value) {
                    this.removeAttribute(key);
                }
            });
        }
        if (BLOCKS_SETTINGS[this.type].defaults.classes) {
            const defaultClasses = this.getClasses(BLOCKS_SETTINGS[this.type].defaults.classes);
            defaultClasses.forEach((classString) => {
                this.removeClass(classString);
            });
        }
    }
    applyDefaults() {
        if (BLOCKS_SETTINGS[this.type].defaults.styles) {
            const defaultStyles = this.getStyles(BLOCKS_SETTINGS[this.type].defaults.styles);
            this.setStyles(defaultStyles);
        }
        if (BLOCKS_SETTINGS[this.type].defaults.attributes) {
            const defaultAttributes = this.getAttributes(BLOCKS_SETTINGS[this.type].defaults.attributes);
            this.setAttributes(defaultAttributes);
        }
        if (BLOCKS_SETTINGS[this.type].defaults.classes) {
            const defaultClasses = this.getClasses(BLOCKS_SETTINGS[this.type].defaults.classes);
            defaultClasses.forEach((classString) => {
                this.addClass(classString);
            });
        }
    }
    // Utility methods for better readability
    isListType(type) {
        return (type === BLOCK_TYPES.numberedList || type === BLOCK_TYPES.bulletedList);
    }
    shouldClearContent(type) {
        const contentElement = this.getContentElement();
        const isEmptyContent = !contentElement || isEmpty(contentElement) || this.content.trim() === "/";
        return (isEmptyContent ||
            (isEmptyContent && type === BLOCK_TYPES.code) ||
            type === BLOCK_TYPES.image ||
            type === BLOCK_TYPES.video);
    }
    pasteContent(e) {
        this.PasteManager.pasteContent(e);
        this.sendUpdateBloxEvent();
    }
    // Getter for styles
    getStyles(stylesString) {
        const styleMap = {};
        const blockStyles = stylesString !== null && stylesString !== void 0 ? stylesString : this.styles;
        blockStyles
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
        this.sendUpdateStyleEvent();
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
        this.sendUpdateStyleEvent();
    }
    // Remove a specific style
    removeStyle(property) {
        const styles = this.getStyles();
        delete styles[convertToCamelCase(property)];
        this.styles = Object.entries(styles)
            .map(([key, val]) => `${key}: ${val}`)
            .join("; ");
        this.sendUpdateStyleEvent();
    }
    // Clear all styles
    clearStyles() {
        this.styles = "";
        this.sendUpdateStyleEvent();
    }
    // Getter for classes
    getClasses(classesString) {
        const blockClasses = classesString !== null && classesString !== void 0 ? classesString : this.classes;
        return blockClasses.split(" ").filter((cls) => cls.trim());
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
    getAttributes(attributesString) {
        const attributesMap = {};
        const blockAttributes = attributesString !== null && attributesString !== void 0 ? attributesString : this.attributes;
        // Use a regex to correctly capture key="value" or key='value'
        const regex = /([\w-]+)=["']?([^"']+)["']?/g;
        let match;
        while ((match = regex.exec(blockAttributes)) !== null) {
            const key = match[1].trim();
            const value = match[2].trim();
            attributesMap[key] = value;
        }
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
        this.sendUpdateStyleEvent();
    }
    // Setter for multiple attributes
    setAttributes(attributes) {
        const currentAttributes = this.getAttributes();
        // Merge new attributes into the existing ones
        Object.entries(attributes).forEach(([key, value]) => {
            currentAttributes[key.trim()] = value.trim();
        });
        // Convert the updated attributes back to a string, ensuring all values use double quotes
        this.attributes = Object.entries(currentAttributes)
            .map(([key, val]) => `${key}="${val.replace(/"/g, "&quot;")}"`)
            .join("; ");
        this.sendUpdateStyleEvent();
    }
    // Remove a specific attribute
    removeAttribute(attribute) {
        const attributes = this.getAttributes();
        delete attributes[attribute.trim()];
        this.attributes = Object.entries(attributes)
            .map(([key, val]) => `${key}="${val}"`)
            .join("; ");
        this.sendUpdateStyleEvent();
    }
    // Clear all attributes
    clearAttributes() {
        this.attributes = "";
        this.sendUpdateStyleEvent();
    }
    setIsSelected(isSelected) {
        this.isSelected = isSelected;
        this.sendUpdateBloxEvent();
    }
    sendUpdateStyleEvent() {
        var _a;
        (_a = this.StyleManager) === null || _a === void 0 ? void 0 : _a.updateCurrentStyles(this);
        setTimeout(() => { var _a; return (_a = this.HistoryManager) === null || _a === void 0 ? void 0 : _a.saveState(); }, 500);
    }
    sendUpdateBloxEvent() {
        this.emit(EVENTS.blocksChanged);
    }
}
