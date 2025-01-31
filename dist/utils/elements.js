export const isEmpty = (element) => {
    return (!element.textContent ||
        element.textContent.trim() === "" ||
        element.textContent.trim() === "\u200B" ||
        element.innerHTML.trim() === "<br>");
};
