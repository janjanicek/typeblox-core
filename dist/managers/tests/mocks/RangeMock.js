export const createRangeMock = (targetElement) => {
    const range = {
        setStart: jest.fn(),
        setEnd: jest.fn(),
        collapse: jest.fn(),
        insertNode: jest.fn((node) => {
            const container = range.startContainer;
            if (container.nodeType === Node.TEXT_NODE) {
                const textNode = container;
                const text = textNode.textContent;
                const beforeText = text.slice(0, range.startOffset);
                const afterText = text.slice(range.startOffset);
                const parent = textNode.parentNode;
                parent.replaceChild(document.createTextNode(beforeText), textNode);
                parent.insertBefore(node, parent.childNodes[1]);
                parent.insertBefore(document.createTextNode(afterText), node.nextSibling);
            }
        }),
        startContainer: targetElement,
        startOffset: 0,
        endContainer: targetElement,
        endOffset: 0,
    };
    return range;
};
