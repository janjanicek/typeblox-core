export const createSelectionMock = (range: Range): Selection => {
  return {
    rangeCount: 1,
    getRangeAt: jest.fn().mockReturnValue(range),
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
    collapse: jest.fn(),
    anchorNode: range.startContainer,
    anchorOffset: range.startOffset,
    focusNode: range.endContainer,
    focusOffset: range.endOffset,
    isCollapsed:
      range.startContainer === range.endContainer &&
      range.startOffset === range.endOffset,
    type: "Range", // Or 'Caret' depending on the context
    extend: jest.fn(),
    collapseToStart: jest.fn(),
    collapseToEnd: jest.fn(),
    selectAllChildren: jest.fn(),
    deleteFromDocument: jest.fn(),
  } as unknown as Selection;
};
