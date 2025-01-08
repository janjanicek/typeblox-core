"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCssStyle = void 0;
const toCssStyle = (jsStyleKey) => {
    return jsStyleKey === null || jsStyleKey === void 0 ? void 0 : jsStyleKey.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
};
exports.toCssStyle = toCssStyle;
