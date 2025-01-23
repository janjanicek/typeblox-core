/**
 * @jest-environment jsdom
 */

import { BloxManager } from "../BloxManager";
import { Blox } from "../../classes/Blox";
import { HistoryManager } from "../HistoryManager";
import { BLOCK_TYPES } from "../../constants";

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
        createMockBlox("1", "aaabbbb"), // First block
      ]);
    });

    afterEach(() => {
      bloxManager.setBlox([]);
    });

    it("should split the block into two blocks at the cursor position", () => {
      // Mock DOM selection to simulate the cursor position after "aaa"
      window.getSelection = jest.fn().mockReturnValue({
        rangeCount: 1,
        getRangeAt: jest.fn().mockReturnValue({
          startOffset: 3,
        }),
      });

      mockDOMManager.getBlockElementById.mockReturnValue({}); // Simulate block element

      bloxManager.split("1");

      // Check that two blocks are created
      expect(bloxManager.getBlox()).toHaveLength(2);
      expect(bloxManager.getBlox()[0].content).toBe("aaa");
      expect(bloxManager.getBlox()[1].content).toBe("bbbb");
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
      expect(bloxManager.getBlox()[0].content).toBe("aaabbbb");
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
      expect(bloxManager.getBlox()[0].content).toBe("aaabbbb");
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
          content: "cccc",
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
    });

    it("should merge the current block with the previous block", () => {
      bloxManager.merge("2");

      // Check that the second block is merged into the first
      expect(bloxManager.getBlox()).toHaveLength(1);
      expect(bloxManager.getBlox()[0].content).toBe("aaabbbbcccc");
    });

    it("should do nothing if the block is the first block", () => {
      bloxManager.merge("1");

      // Ensure no blocks are merged
      expect(bloxManager.getBlox()).toHaveLength(2);
      expect(bloxManager.getBlox()[0].content).toBe("aaabbbb");
      expect(bloxManager.getBlox()[1].content).toBe("cccc");
    });
  });
});
