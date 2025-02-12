import {
  addBlockType,
  removeBlockType,
  getAvailableBlocks,
  getBlockSettings,
  updateBlockSettings,
  getToolbars,
  BLOCK_TYPES,
  BLOCKS_SETTINGS,
  DEFAULT_BLOCK_TYPE,
} from "../blockTypes"; // Adjust import path if necessary
import { BlockType } from "../types";

describe("Block Settings Module", () => {
  beforeEach(() => {
    // Reset BLOCK_TYPES and BLOCKS_SETTINGS before each test
    Object.keys(BLOCK_TYPES).forEach((key) => {
      delete BLOCK_TYPES[key];
    });

    Object.assign(BLOCK_TYPES, {
      text: "text",
      code: "code",
      image: "image",
      headline1: "headline1",
      headline2: "headline2",
      headline3: "headline3",
      html: "html",
      bulletedList: "bulletedList",
      numberedList: "numberedList",
      blockquote: "blockquote",
    });
  });

  describe("addBlockType", () => {
    it("should add a new block type", () => {
      addBlockType("customBlock", "customBlockKey");
      expect(BLOCK_TYPES.customBlock).toBe("customBlockKey");
    });
  });

  describe("removeBlockType", () => {
    it("should remove an existing block type", () => {
      addBlockType("tempBlock", "tempKey");
      removeBlockType("tempBlock");
      expect(BLOCK_TYPES.tempBlock).toBeUndefined();
    });

    it("should not throw an error if the block type does not exist", () => {
      expect(() => removeBlockType("nonExistentBlock")).not.toThrow();
    });
  });

  describe("getAvailableBlocks", () => {
    it("should return a list of available block names", () => {
      const availableBlocks = getAvailableBlocks();
      expect(Array.isArray(availableBlocks)).toBe(true);
      expect(availableBlocks).toContain("headline1");
      expect(availableBlocks).toContain("text");
    });
  });

  describe("getBlockSettings", () => {
    it("should return the full block settings object", () => {
      const settings = getBlockSettings();
      expect(settings).toEqual(BLOCKS_SETTINGS);
    });
  });

  describe("updateBlockSettings", () => {
    it("should update an existing block setting", () => {
      updateBlockSettings("headline1", { visibleName: "Updated Headline" });

      expect(BLOCKS_SETTINGS.headline1.visibleName).toBe("Updated Headline");
    });

    it("should add a new block setting if it doesn't exist", () => {
      updateBlockSettings("customBlock" as BlockType, {
        tag: "div",
        visibleName: "Custom Block",
        blockName: "customBlock",
        placeholder: "Custom Placeholder",
        contentPattern: (content: string) => content,
        description: "A custom block",
        toolbar: "type | font | bold",
        icon: "CustomIcon",
        availableTypes: ["text"],
        defaults: {
          classes: "",
          attributes: "",
          styles: "",
        },
      });

      expect(BLOCKS_SETTINGS.customBlock).toBeDefined();
      expect(BLOCKS_SETTINGS.customBlock.visibleName).toBe("Custom Block");
    });
  });

  describe("getToolbars", () => {
    it("should return a mapping of block types to toolbar settings", () => {
      const toolbars = getToolbars();
      expect(toolbars).toHaveProperty("text");
      expect(toolbars["text"]).toBe(BLOCKS_SETTINGS.text.toolbar);
    });
  });

  describe("Default Block Type", () => {
    it("should have the correct default block type", () => {
      expect(DEFAULT_BLOCK_TYPE).toBe("text");
    });
  });
});
