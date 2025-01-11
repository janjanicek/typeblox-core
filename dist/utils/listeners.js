export const registerListeners = (detectSelection) => {
    document.addEventListener("selectionchange", detectSelection);
};
export const removeListeners = (detectSelection) => {
    document.removeEventListener("selectionchange", detectSelection);
};
