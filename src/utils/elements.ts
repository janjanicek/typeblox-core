export const isEmpty = (element: HTMLElement): boolean => {
  return (
    !element.textContent ||
    element.textContent.trim() === "" ||
    element.textContent.trim() === "\u200B" ||
    element.innerHTML.trim() === "<br>"
  );
};
