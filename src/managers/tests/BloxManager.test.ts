/**
 * @jest-environment jsdom
 */

import { BloxManager } from "../BloxManager";
import { Blox } from "../../classes/Blox";
import { HistoryManager } from "../HistoryManager";
import { BLOCK_TYPES } from "../../constants";

const createMockBlockElement = (id: string, innerHTML: string) => {
  const element = document.createElement("div");
  element.id = id;
  element.innerHTML = innerHTML;
  return element;
};

describe("BloxManager", () => {
  let bloxManager: BloxManager;
  let mockOnChange: jest.Mock;
  let mockDOMManager: any;

  // Mocks for dependencies
  const mockOnUpdate = jest.fn();
  const mockTypingManager = {} as any;
  const mockFormatManager = {} as any;
  const mockPasteManager = {} as any;
  let mockHistoryManager = {} as HistoryManager;

  // Helper function to create mock Blox instances
  const createMockBlox = (id: string, content: string): Blox => {
    return new Blox({
      id,
      type: "text",
      content,
      onUpdate: mockOnUpdate,
      TypingManager: mockTypingManager,
      StyleManager: mockFormatManager,
      PasteManager: mockPasteManager,
    });
  };

  beforeEach(() => {
    mockOnChange = jest.fn();
    mockDOMManager = {
      getBlockElement: jest.fn(),
      blocksToHTML: jest.fn(),
      focusBlock: jest.fn(),
      getBlockElementById: jest.fn(),
    };
    mockHistoryManager = new HistoryManager();

    bloxManager = new BloxManager(mockOnChange);
    bloxManager.setDependencies(
      mockTypingManager,
      mockFormatManager,
      mockPasteManager,
      mockDOMManager,
      mockHistoryManager,
      mockOnChange,
    );
  });

  describe("areBloxArraysEqual", () => {
    test("should return true when both arrays are empty", () => {
      const result = (bloxManager as any).areBloxArraysEqual([], []);
      expect(result).toBe(true);
    });

    test("should return false when arrays have different lengths", () => {
      const block1 = createMockBlox("1", "Block 1");
      const block2 = createMockBlox("2", "Block 2");
      const result = (bloxManager as any).areBloxArraysEqual(
        [block1],
        [block1, block2],
      );
      expect(result).toBe(false);
    });

    test("should return true when arrays have identical Blox properties", () => {
      const block1 = createMockBlox("1", "Block 1");
      const block2 = createMockBlox("2", "Block 2");
      const arrayA = [block1, block2];
      const arrayB = [block1, block2];
      const result = (bloxManager as any).areBloxArraysEqual(arrayA, arrayB);
      expect(result).toBe(true);
    });

    test("should return false when a block's property differs", () => {
      const block1 = createMockBlox("1", "Block 1");
      const block2 = createMockBlox("2", "Block 2");
      const block2Different = createMockBlox("2", "Different Content");
      const result = (bloxManager as any).areBloxArraysEqual(
        [block1, block2],
        [block1, block2Different],
      );
      expect(result).toBe(false);
    });
  });

  test("should add a new block after an existing block", () => {
    const existingBlock = createMockBlox("1", "Block 1");
    bloxManager.setBlox([existingBlock]);

    const newBlockId = bloxManager.addBlockAfter("1", "text", "Block 2");

    expect(newBlockId).not.toBeNull();
    expect(bloxManager.getBlox().length).toBe(2);
    expect(bloxManager.getBlox()[1].content).toBe("Block 2");
  });

  test("should add a new block before an existing block", () => {
    const existingBlock = createMockBlox("1", "Block 1");
    bloxManager.setBlox([existingBlock]);

    const newBlockId = bloxManager.addBlockBefore("1", "text", "Block 2");

    expect(newBlockId).not.toBeNull();
    expect(bloxManager.getBlox().length).toBe(2);
    expect(bloxManager.getBlox()[0].content).toBe("Block 2");
  });

  test("should not add a block if blockId is not found", () => {
    const result = bloxManager.addBlockAfter(
      "non-existent-id",
      "text",
      "New Block",
    );

    expect(result).toBeNull();
    expect(bloxManager.getBlox().length).toBe(0);
  });

  test("should remove a block by ID", () => {
    const block1 = createMockBlox("1", "Block 1");
    const block2 = createMockBlox("2", "Block 2");
    bloxManager.setBlox([block1, block2]);

    const result = bloxManager.removeById("1");

    expect(result).toBe(true);
    expect(bloxManager.getBlox().length).toBe(1);
    expect(bloxManager.getBlox()[0].id).toBe("2");
  });

  test("should move a block up", () => {
    const block1 = createMockBlox("1", "Block 1");
    const block2 = createMockBlox("2", "Block 2");
    const block3 = createMockBlox("3", "Block 3");
    bloxManager.setBlox([block1, block2, block3]);

    const result = bloxManager.moveBlockUp("2");

    expect(result).toBe(true);
    expect(bloxManager.getBlox()[0].id).toBe("2");
    expect(bloxManager.getBlox()[1].id).toBe("1");
    expect(bloxManager.getBlox()[2].id).toBe("3");
  });

  test("should not move the first block up", () => {
    const block1 = createMockBlox("1", "Block 1");
    const block2 = createMockBlox("2", "Block 2");
    bloxManager.setBlox([block1, block2]);

    const result = bloxManager.moveBlockUp("1");

    expect(result).toBe(false);
    expect(bloxManager.getBlox()[0].id).toBe("1");
  });

  test("should move a block down", () => {
    const block1 = createMockBlox("1", "Block 1");
    const block2 = createMockBlox("2", "Block 2");
    const block3 = createMockBlox("3", "Block 3");
    bloxManager.setBlox([block1, block2, block3]);

    const result = bloxManager.moveBlockDown("2");

    expect(result).toBe(true);
    expect(bloxManager.getBlox()[1].id).toBe("3");
    expect(bloxManager.getBlox()[2].id).toBe("2");
  });

  test("should not move the last block down", () => {
    const block1 = createMockBlox("1", "Block 1");
    const block2 = createMockBlox("2", "Block 2");
    bloxManager.setBlox([block1, block2]);

    const result = bloxManager.moveBlockDown("2");

    expect(result).toBe(false);
    expect(bloxManager.getBlox()[1].id).toBe("2");
  });

  test("should update blocks and call onChange", () => {
    const block1 = createMockBlox("1", "Block 1");
    const block2 = createMockBlox("2", "Block 2");
    bloxManager.setBlox([block1, block2]);

    mockDOMManager.blocksToHTML.mockReturnValue("<p>Block 1</p><p>Block 2</p>");
    bloxManager.update(mockOnChange);

    expect(mockOnChange).toHaveBeenCalledWith("<p>Block 1</p><p>Block 2</p>");
  });

  describe("Attributes Management", () => {
    let block: Blox;

    beforeEach(() => {
      block = createMockBlox("1", "Initial Content");
    });

    test("should get attributes as a key-value pair object", () => {
      block.attributes = 'data-id="block-1"; aria-label="content";';
      const attributes = block.getAttributes();
      expect(attributes).toEqual({
        "data-id": "block-1",
        "aria-label": "content",
      });
    });

    test("should set a single attribute", () => {
      block.setAttribute("role", "textbox");
      expect(block.attributes).toContain('role="textbox"');
    });

    test("should overwrite an existing attribute when set again", () => {
      block.setAttribute("data-id", "block-1");
      block.setAttribute("data-id", "block-2");
      expect(block.attributes).toContain('data-id="block-2"');
    });

    test("should set multiple attributes", () => {
      block.setAttributes({
        "data-id": "block-1",
        "aria-label": "content",
        role: "textbox",
      });
      expect(block.attributes).toContain('data-id="block-1"');
      expect(block.attributes).toContain('aria-label="content"');
      expect(block.attributes).toContain('role="textbox"');
    });

    test("should remove a specific attribute", () => {
      block.attributes = 'data-id="block-1"; role="textbox";';
      block.removeAttribute("role");
      expect(block.attributes).toContain('data-id="block-1"');
      expect(block.attributes).not.toContain('role="textbox"');
    });

    test("should clear all attributes", () => {
      block.attributes = 'data-id="block-1"; role="textbox";';
      block.clearAttributes();
      expect(block.attributes).toBe("");
    });
  });

  describe("split", () => {
    beforeEach(() => {
      bloxManager.setBlox([
        createMockBlox("1", "<b>aaa</b>bbbb"), // First block
      ]);
    });

    afterEach(() => {
      bloxManager.setBlox([]);
    });

    it("should split the block into two blocks at the cursor position", () => {
      // Create a mock HTMLElement with initial content
      const mockBlockElement = document.createElement("div");
      mockBlockElement.innerHTML = "<b>aaa</b>bbbb";

      // Mock DOMManager.getBlockElementById to return the mockBlockElement
      mockDOMManager.getBlockElementById.mockReturnValue(mockBlockElement);

      // Mock the selection and range to simulate the cursor after "aaa"
      const mockRange = document.createRange();
      const boldElement = mockBlockElement.querySelector("b");
      if (boldElement) {
        mockRange.setStartAfter(boldElement);
        mockRange.collapse(true);
      }

      const mockSelection = {
        rangeCount: 1,
        getRangeAt: jest.fn().mockReturnValue(mockRange),
      };

      window.getSelection = jest
        .fn()
        .mockReturnValue(mockSelection as unknown as Selection);

      // Call the split function
      bloxManager.split("1");

      // After splitting, the blocks should be updated
      expect(bloxManager.getBlox()).toHaveLength(2);
      expect(bloxManager.getBlox()[0].content).toBe("<b>aaa</b>");
      expect(bloxManager.getBlox()[1].content).toBe("bbbb");

      // Verify that split-point was inserted and removed
      expect(mockBlockElement.querySelector("split-point")).toBeNull();
    });

    it("should do nothing if the cursor is at the start of the block", () => {
      // Mock DOM selection to simulate the cursor position at the start

      window.getSelection = jest.fn().mockReturnValue({
        rangeCount: 1,
        getRangeAt: jest.fn().mockReturnValue({
          startOffset: 0,
        }),
      });

      mockDOMManager.getBlockElementById.mockReturnValue({});

      bloxManager.split("1");

      // Ensure no new blocks are created
      expect(bloxManager.getBlox()).toHaveLength(1);
      expect(bloxManager.getBlox()[0].content).toBe("<b>aaa</b>bbbb");
    });

    it("should do nothing if the cursor is at the end of the block", () => {
      // Mock DOM selection to simulate the cursor position at the end
      window.getSelection = jest.fn().mockReturnValue({
        rangeCount: 1,
        getRangeAt: jest.fn().mockReturnValue({
          startOffset: 7,
        }),
      });

      mockDOMManager.getBlockElementById.mockReturnValue({});

      bloxManager.split("1");

      // Ensure no new blocks are created
      expect(bloxManager.getBlox()).toHaveLength(1);
      expect(bloxManager.getBlox()[0].content).toBe("<b>aaa</b>bbbb");
    });
  });

  describe("merge", () => {
    beforeEach(() => {
      bloxManager.setBlox([
        createMockBlox("1", "aaabbbb"), // First block
      ]);
      bloxManager.getBlox().push(
        new Blox({
          id: "2",
          content: "<b>cc</b>cc",
          type: BLOCK_TYPES.text,
          onUpdate: jest.fn(),
          TypingManager: jest.fn() as any,
          StyleManager: jest.fn() as any,
          PasteManager: jest.fn() as any,
        }),
      );
    });

    afterEach(() => {
      bloxManager.setBlox([]);
      jest.clearAllMocks();
    });

    it("should not merge when there is no previous block", () => {
      const mockBlockElement = createMockBlockElement("1", "aaabbbb");
      mockDOMManager.getBlockElementById.mockReturnValue(mockBlockElement);

      bloxManager.merge("1");

      expect(bloxManager.getBlox()).toHaveLength(2);
      expect(bloxManager.getBlox()[0].content).toBe("aaabbbb");
      expect(bloxManager.getBlox()[1].content).toBe("<b>cc</b>cc");

      expect(mockDOMManager.focusBlock).not.toHaveBeenCalled();
    });

    it("should do nothing if the block is the first block", () => {
      bloxManager.merge("1");

      // Ensure no blocks are merged
      expect(bloxManager.getBlox()).toHaveLength(2);
      expect(bloxManager.getBlox()[0].content).toBe("aaabbbb");
      expect(bloxManager.getBlox()[1].content).toBe("<b>cc</b>cc");
    });

    it("should merge the current block with the previous block and maintain cursor position", () => {
      bloxManager.setBlox([
        createMockBlox("1", "aaabbbb"), // First block
        new Blox({
          id: "2",
          content: "<b>cc</b>cc",
          type: BLOCK_TYPES.text,
          onUpdate: jest.fn(),
          TypingManager: jest.fn() as any,
          StyleManager: jest.fn() as any,
          PasteManager: jest.fn() as any,
        }),
      ]);

      const mockPreviousBlockElement = createMockBlockElement("1", "aaabbbb");
      const mockCurrentBlockElement = createMockBlockElement(
        "2",
        "<b>cc</b>cc",
      );

      mockDOMManager.getBlockElementById.mockImplementation((id: string) => {
        if (id === "1") return mockPreviousBlockElement;
        if (id === "2") return mockCurrentBlockElement;
        return null;
      });

      const mockRange = document.createRange();
      mockRange.selectNodeContents(mockPreviousBlockElement);
      mockRange.collapse(false); // Collapse to end of previous block

      const mockSelection = {
        removeAllRanges: jest.fn(),
        addRange: jest.fn(),
        rangeCount: 1,
        getRangeAt: jest.fn().mockReturnValue(mockRange),
      };

      window.getSelection = jest
        .fn()
        .mockReturnValue(mockSelection as unknown as Selection);
      jest.useFakeTimers();

      bloxManager.merge("2");

      jest.runAllTimers();

      expect(bloxManager.getBlox()).toHaveLength(1);
      expect(mockPreviousBlockElement.innerHTML).toBe("aaabbbb<b>cc</b>cc");
      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalledWith(expect.any(Range));
    });
  });
});
