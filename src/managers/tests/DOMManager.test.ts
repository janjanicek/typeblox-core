import { DOMManager } from "../../managers/DOMManager";
import { Blox } from "../../classes/Blox";
import { BloxManager } from "../../managers/BloxManager";
import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../../constants";

jest.mock("../../managers/BloxManager");

describe("DOMManager", () => {
  let domManager: DOMManager;
  let mockBloxManager: jest.Mocked<BloxManager>;

  beforeEach(() => {
    mockBloxManager = {
      createBlox: jest.fn(),
    } as unknown as jest.Mocked<BloxManager>;
    domManager = new DOMManager(mockBloxManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("removeElement", () => {
    it("should remove the parent element and retain children", () => {
      const parent = document.createElement("b");
      const child = document.createElement("span");
      parent.appendChild(child);
      document.body.appendChild(parent);

      domManager.removeElement(parent);

      expect(document.body.contains(parent)).toBe(false);
      expect(document.body.contains(child)).toBe(true);
    });

    it("should warn if element has no parent", () => {
      const element = document.createElement("div");
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      domManager.removeElement(element);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Cannot remove element because it has no parent.",
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("sanitizeHTML", () => {
    it("should remove disallowed tags and style attributes", () => {
      const dirtyHTML =
        '<div style="color: red;"><b>Allowed</b><script>Malicious</script></div>';
      const sanitizedHTML = domManager.sanitizeHTML(dirtyHTML);

      expect(sanitizedHTML).toBe("<b>Allowed</b>");
    });
  });

  describe("blocksToHTML", () => {
    it("should convert blocks to HTML", () => {
      const blocks: Blox[] = [
        new Blox({
          id: "1",
          content: "Hello",
          type: BLOCK_TYPES.text,
          onUpdate: jest.fn(),
          TypingManager: jest.fn() as any,
          StyleManager: jest.fn() as any,
          PasteManager: jest.fn() as any,
          style: "color: red;",
          classes: "example-class",
        }),
      ];

      const result = domManager.blocksToHTML(blocks);

      expect(result).toBe(
        '<p style="color: red;" class="example-class" >Hello</p>',
      );
    });

    it("should return an empty string for empty content blocks", () => {
      const blocks: Blox[] = [
        new Blox({
          id: "1",
          content: "",
          type: "text",
          onUpdate: jest.fn(),
          TypingManager: jest.fn() as any,
          StyleManager: jest.fn() as any,
          PasteManager: jest.fn() as any,
        }),
      ];

      const result = domManager.blocksToHTML(blocks);

      expect(result).toBe("");
    });
  });

  describe("getBlockElementById", () => {
    it("should return the element with the given block ID", () => {
      const element = document.createElement("div");
      element.setAttribute("data-typeblox-id", "test-id");
      document.body.appendChild(element);

      const result = domManager.getBlockElementById("test-id");

      expect(result).toBe(element);
    });

    it("should return null if no element is found", () => {
      const result = domManager.getBlockElementById("non-existent-id");

      expect(result).toBeNull();
    });
  });

  describe("getBlockElement", () => {
    let range: Range;
    let selection: Selection;
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement("div");
      element.setAttribute("data-typeblox-id", "block-id");
      document.body.appendChild(element);

      range = {
        startContainer: element,
        selectNode: jest.fn(),
      } as unknown as Range;

      selection = {
        rangeCount: 1,
        getRangeAt: jest.fn(() => range),
        removeAllRanges: jest.fn(),
        addRange: jest.fn(),
      } as unknown as Selection;

      jest.spyOn(window, "getSelection").mockReturnValue(selection);
    });

    afterEach(() => {
      document.body.innerHTML = "";
      jest.restoreAllMocks();
    });

    it("should return the closest block element", () => {
      const result = domManager.getBlockElement();
      expect(result).toBe(element);
    });

    it("should return null if no selection exists", () => {
      jest.spyOn(window, "getSelection").mockReturnValue(null); // Override for this test

      const result = domManager.getBlockElement();
      expect(result).toBeNull();
    });
  });

  describe("parseHTMLToBlocks", () => {
    it("should parse HTML into blocks", () => {
      const htmlString =
        '<p class="abcd">Hello</p><img style="width: 300px" src="image.png" title="abcd" />';

      // Call the method
      const blocks = domManager.parseHTMLToBlocks(htmlString);

      // Verify createBlox was called four times (twice per element)
      expect(mockBloxManager.createBlox).toHaveBeenCalledTimes(2);

      // Verify the second call (specific block for <p>)
      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(1, {
        id: expect.any(String), // Generated ID
        type: BLOCKS_SETTINGS.text.blockName, // Block type for <p>
        content: "Hello", // Inner content of <p>
        style: null,
        classes: "abcd",
        attributes: "",
      });

      // Verify the fourth call (specific block for <img>)
      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(2, {
        id: expect.any(String), // Generated ID
        type: BLOCKS_SETTINGS.image.blockName, // Block type for <img>
        content: "image.png", // src attribute of <img>
        style: "width: 300px",
        classes: null,
        attributes: 'title="abcd"',
      });
    });

    it("should parse HTML into blocks when no children", () => {
      const htmlString = "Text";

      // Call the method
      const blocks = domManager.parseHTMLToBlocks(htmlString);

      // Verify createBlox was called four times (twice per element)
      expect(mockBloxManager.createBlox).toHaveBeenCalledTimes(1);

      // Verify the second call (specific block for <p>)
      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(1, {
        id: expect.any(String), // Generated ID
        type: BLOCKS_SETTINGS.text.blockName, // Block type for <p>
        content: "Text", // Inner content of <p>
      });
    });

    it("should warn if BloxManager is not initialized", () => {
      const domManagerWithoutBloxManager = new DOMManager();
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const blocks =
        domManagerWithoutBloxManager.parseHTMLToBlocks("<p>Test</p>");

      expect(blocks).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
