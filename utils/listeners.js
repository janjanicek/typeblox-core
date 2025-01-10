"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeListeners = exports.registerListeners = void 0;
const registerListeners = (detectSelection) => {
  document.addEventListener("selectionchange", detectSelection);
};
exports.registerListeners = registerListeners;
const removeListeners = (detectSelection) => {
  document.removeEventListener("selectionchange", detectSelection);
};
exports.removeListeners = removeListeners;
