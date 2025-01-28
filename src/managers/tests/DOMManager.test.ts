import { DOMManager } from "../../managers/DOMManager";
import { Blox } from "../../classes/Blox";
import { BloxManager } from "../../managers/BloxManager";
import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../../constants";
import { createRangeMock } from "./mocks/RangeMock";
import { createSelectionMock } from "./mocks/SelectionMock";

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

      range = createRangeMock(element);
      selection = createSelectionMock(range);

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

  describe("split", () => {
    const testCases = [
      {
        description: "should split the target element correctly",
        html: `<div id="parent"><p>Hello <b>world</b></p></div>`,
        selector: "p",
        splitPosition: 5, // Split after "Hello "
        expectedChildrenCount: 2,
        expectedChildrenContent: ["Hello", "<b>world</b>"],
        shouldCallFocusElement: true,
      },
      {
        description: "should split the list element",
        html: `<ul id="parent"><li>testing</li></ul>`,
        selector: "li",
        splitPosition: 3, // Split after "tes"
        expectedChildrenCount: 2,
        expectedChildrenContent: ["tes", "ting"],
        shouldCallFocusElement: true,
      },
      {
        description: "should not split if no matching selector is found",
        html: `<div id="parent"><p>Hello <b>world</b></p></div>`,
        selector: "p",
        splitPosition: null,
        expectedChildrenCount: 1,
        expectedChildrenContent: ["<p>Hello <b>world</b></p>"], // Match outerHTML
        shouldCallFocusElement: false,
      },
      {
        description: "should not split if no selection is active",
        html: `<div id="parent"><p>Hello <b>world</b></p></div>`,
        selector: "p",
        splitPosition: null, // No active range
        expectedChildrenCount: 1,
        expectedChildrenContent: ["Hello <b>world</b>"],
        shouldCallFocusElement: false,
      },
      {
        description:
          "should not split if the range does not match the selector",
        html: `<div id="parent"><p>Hello <b>world</b></p></div>`,
        selector: "p", // Selector matches the <p>, but no valid range
        splitPosition: null,
        expectedChildrenCount: 1,
        expectedChildrenContent: ["Hello <b>world</b>"], // Match innerHTML
        shouldCallFocusElement: false,
      },
    ];

    test.each(testCases)(
      "$description",
      ({
        html,
        selector,
        splitPosition,
        expectedChildrenCount,
        expectedChildrenContent,
        shouldCallFocusElement,
      }) => {
        // Set up the DOM
        document.body.innerHTML = html;
        const targetElement = document.querySelector(selector);
        const parentElement = targetElement?.parentElement;

        const range = document.createRange();
        if (
          splitPosition !== null &&
          targetElement?.firstChild instanceof Text
        ) {
          range.setStart(targetElement.firstChild, splitPosition);
          range.setEnd(targetElement.firstChild, splitPosition);
        }

        // Mock Selection
        const selection = {
          rangeCount: splitPosition !== null ? 1 : 0,
          getRangeAt: jest.fn().mockReturnValue(range),
          removeAllRanges: jest.fn(),
          addRange: jest.fn(),
        } as unknown as Selection;

        jest.spyOn(window, "getSelection").mockReturnValue(selection);

        // Mock focusElement
        const splitElement = jest.fn();
        const context = { focusElement: splitElement };

        jest
          .spyOn(global, "requestAnimationFrame")
          .mockImplementation((cb: FrameRequestCallback): number => {
            cb(0);
            return 0;
          });

        if (splitPosition === null || !targetElement) {
          // Expect an error if no selection or no matching element
          expect(() =>
            domManager.splitElementBySelector.call(context, selector),
          ).toThrowError("No selection available in the current context.");
          return;
        }

        // Call the function
        domManager.splitElementBySelector.call(context, selector);

        // Assert children count and content
        const children = parentElement?.querySelectorAll(selector);
        expect(children?.length).toBe(expectedChildrenCount);
        expectedChildrenContent.forEach((content, index) => {
          const child = children?.[index];
          if (content.startsWith("<p>") || content.startsWith("<li>")) {
            expect(child?.outerHTML).toBe(content); // Match outerHTML for full elements
          } else {
            expect(child?.innerHTML).toBe(content); // Match innerHTML for inner content
          }
        });

        // Assert focusElement call
        if (shouldCallFocusElement) {
          expect(splitElement).toHaveBeenCalledWith(
            children?.[expectedChildrenCount - 1],
          );
        } else {
          expect(splitElement).not.toHaveBeenCalled();
        }
      },
    );
  });

  describe("add", () => {
    const testCases = [
      {
        description: "should add an empty element after the target element",
        html: `<div id="parent"><p>Hello <b>world</b></p></div>`,
        selector: "p",
        rangeStart: 5, // Cursor inside "Hello"
        expectedParentHTML:
          '<div id="parent"><p>Hello <b>world</b></p><p>&nbsp;</p></div>',
        shouldCallFocusElement: true,
      },
      {
        description: "should throw if no selection is active",
        html: `<div id="parent"><p>Hello <b>world</b></p></div>`,
        selector: "p",
        rangeStart: null, // No active range
        expectedParentHTML: '<div id="parent"><p>Hello <b>world</b></p></div>',
        shouldThrowError: true,
      },
      {
        description: "should throw if no matching selector is found",
        html: `<div id="parent"><p>Hello <b>world</b></p></div>`,
        selector: "div", // Selector does not match range
        rangeStart: 5,
        expectedParentHTML: '<div id="parent"><p>Hello <b>world</b></p></div>',
        shouldThrowError: true,
      },
      {
        description: "should add an empty <li> after the selected <li>",
        html: `<ul id="list"><li>Item 1</li><li>Item 2</li></ul>`,
        selector: "li",
        rangeStart: 6, // Cursor inside "Item 1"
        expectedHTML: `<ul id="list"><li>Item 1</li><li>&nbsp;</li><li>Item 2</li></ul>`,
        shouldCallFocusElement: true,
      },
      {
        description: "should throw if no <li> is selected",
        html: `<ul id="list"><li>Item 1</li><li>Item 2</li></ul>`,
        selector: "li",
        rangeStart: null, // No active range
        expectedHTML: `<ul id="list"><li>Item 1</li><li>Item 2</li></ul>`,
        shouldThrowError: true,
      },
      {
        description: "should throw if the parent is not a list",
        html: `<div id="container"><p>Item</p></div>`,
        selector: "li", // No matching <li> in a list context
        rangeStart: 2,
        expectedHTML: `<div id="container"><p>Item</p></div>`,
        shouldThrowError: true,
      },
    ];

    test.each(testCases)(
      "$description",
      ({
        html,
        selector,
        rangeStart,
        expectedHTML,
        shouldCallFocusElement = false,
        shouldThrowError = false,
      }) => {
        // Set up the DOM
        document.body.innerHTML = html;
        const listElement = document.getElementById("list"); // Parent list element
        const targetElement = document.querySelector(selector); // Target element

        const range = document.createRange();
        if (rangeStart !== null && targetElement?.firstChild instanceof Text) {
          range.setStart(targetElement.firstChild, rangeStart);
          range.setEnd(targetElement.firstChild, rangeStart);
        }

        // Mock Selection
        const selection = {
          rangeCount: rangeStart !== null ? 1 : 0,
          getRangeAt: jest.fn().mockReturnValue(range),
          removeAllRanges: jest.fn(),
          addRange: jest.fn(),
        } as unknown as Selection;

        jest.spyOn(window, "getSelection").mockReturnValue(selection);

        // Mock focusElement
        const focusElement = jest.fn();
        const context = { focusElement };

        // Mock requestAnimationFrame
        jest
          .spyOn(global, "requestAnimationFrame")
          .mockImplementation((cb: FrameRequestCallback): number => {
            cb(0); // Execute the callback immediately
            return 0; // Return a mock animation frame ID
          });

        if (shouldThrowError) {
          expect(() =>
            domManager.addElementAfter.call(context, selector),
          ).toThrowError();
        } else {
          const newElement = domManager.addElementAfter.call(context, selector);

          // Assert the new element
          expect(newElement?.tagName.toLowerCase()).toBe(selector); // Ensure it's an <li>
          expect(newElement?.innerHTML).toBe("&nbsp;"); // Ensure it contains a non-breaking space

          // **Use expectedHTML for assertion**
          expect(listElement?.outerHTML).toBe(expectedHTML);

          // Assert focusElement call
          if (shouldCallFocusElement) {
            expect(focusElement).toHaveBeenCalledWith(newElement);
          } else {
            expect(focusElement).not.toHaveBeenCalled();
          }
        }
      },
    );
  });
});
