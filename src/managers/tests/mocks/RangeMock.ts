export const createRangeMock = (targetElement: HTMLElement): Range => {
  const range = {
    setStart: jest.fn(),
    setEnd: jest.fn(),
    collapse: jest.fn(),
    insertNode: jest.fn((node: Node) => {
      const container = range.startContainer as Node;
      if (container.nodeType === Node.TEXT_NODE) {
        const textNode = container as Text;
        const text = textNode.textContent!;
        const beforeText = text.slice(0, range.startOffset);
        const afterText = text.slice(range.startOffset);

        const parent = textNode.parentNode!;
        parent.replaceChild(document.createTextNode(beforeText), textNode);
        parent.insertBefore(node, parent.childNodes[1]);
        parent.insertBefore(
          document.createTextNode(afterText),
          node.nextSibling,
        );
      }
    }),
    startContainer: targetElement,
    startOffset: 0,
    endContainer: targetElement,
    endOffset: 0,
  } as unknown as Range;

  return range;
};
