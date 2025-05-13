import { DOMManager } from "../../managers/DOMManager";
import { Blox } from "../../classes/Blox";
import { BloxManager } from "../../managers/BloxManager";
import { createRangeMock } from "./mocks/RangeMock";
import { createSelectionMock } from "./mocks/SelectionMock";
import { BLOCKS_SETTINGS, BLOCK_TYPES } from "../../blockTypes";
import { createDOMManagerMock } from "./mocks/DOMManagerMock";
import { LinkManager } from "../LinkManager";
import { TypingManager } from "../TypingManager";
import { EditorManager } from "../EditorManager";

jest.mock("../../managers/BloxManager");

describe("DOMManager", () => {
  let domManager: DOMManager;
  let mockBloxManager: jest.Mocked<BloxManager>;
  let mockTypingManager: jest.Mocked<TypingManager>;
  let mockEditorManger: jest.Mocked<EditorManager>;

  beforeEach(() => {
    mockBloxManager = {
      createBlox: jest.fn(),
    } as unknown as jest.Mocked<BloxManager>;

    mockBloxManager.createBlox.mockImplementation((params) => {
      return new Blox({
        id: params.id || "sample-id",
        type: params.type || BLOCK_TYPES.text,
        content: params.content || "",
        style: params.style,
        classes: params.classes,
        attributes: params.attributes,
        onUpdate: jest.fn(),
        TypingManager: {} as any, // Mocking TypingManager, you can adjust this
        StyleManager: {} as any, // Mocking StyleManager
        PasteManager: {} as any, // Mocking PasteManager
        DOMManager: {} as any, // Mocking DOMManager
        HistoryManager: {} as any, // Mocking HistoryManager
      });
    });

    mockTypingManager = {
      getLastMeaningfulNode: jest.fn(),
      getFirstMeaningfulNode: jest.fn(),
    } as unknown as jest.Mocked<TypingManager>;
    mockEditorManger = {
      editorContainer: "",
    } as unknown as jest.Mocked<EditorManager>;
    domManager = new DOMManager(
      mockBloxManager,
      mockTypingManager,
      mockEditorManger,
      new LinkManager(),
    );
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
          DOMManager: createDOMManagerMock(),
          HistoryManager: jest.fn() as any,
          style: "color: red;",
          classes: "example-class",
        }),
      ];

      const result = domManager.blocksToHTML(blocks);

      expect(result).toBe(
        '<p style="color: red; " class="example-class " >Hello</p>',
      );
    });

    it("should convert video block to HTML", () => {
      const blocks: Blox[] = [
        new Blox({
          id: "1",
          content:
            "https://www.youtube.com/embed/koqBd2H6UqU?si=p9BZVH_k6pS-8i_a",
          type: BLOCK_TYPES.video,
          onUpdate: jest.fn(),
          TypingManager: jest.fn() as any,
          StyleManager: jest.fn() as any,
          PasteManager: jest.fn() as any,
          DOMManager: createDOMManagerMock(),
          HistoryManager: jest.fn() as any,
          style: "color: red;",
          classes: "example-class",
        }),
      ];

      const result = domManager.blocksToHTML(blocks);

      expect(result).toBe(
        '<p data-tbx-block="video" style=""><iframe src="https://www.youtube.com/embed/koqBd2H6UqU?si=p9BZVH_k6pS-8i_a" style="color: red; " class="example-class " width="560" height="315" ></iframe></p>',
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
          DOMManager: createDOMManagerMock(),
          HistoryManager: jest.fn() as any,
        }),
      ];

      const result = domManager.blocksToHTML(blocks);

      expect(result).toBe("");
    });

    it("should convert an image block to HTML", () => {
      const blocks: Blox[] = [
        new Blox({
          id: "1",
          content: "image.png",
          type: BLOCK_TYPES.image,
          onUpdate: jest.fn(),
          TypingManager: jest.fn() as any,
          StyleManager: jest.fn() as any,
          PasteManager: jest.fn() as any,
          DOMManager: createDOMManagerMock(),
          HistoryManager: jest.fn() as any,
          style: "width: 100px;",
          classes: "image-class",
          attributes: 'alt="Image" data-tbx-alignment="center"',
        }),
      ];

      const result = domManager.blocksToHTML(blocks);

      expect(result).toBe(
        '<p data-tbx-block="image" style="text-align: center"><img src="image.png" style="width: 100px; " class="image-class " alt="Image" data-tbx-alignment="center"/></p>',
      );
    });

    it("should convert column blocks to HTML", () => {
      const blocks: Blox[] = [
        new Blox({
          id: "1",
          content: "",
          type: BLOCK_TYPES.columns,
          onUpdate: jest.fn(),
          TypingManager: jest.fn() as any,
          StyleManager: jest.fn() as any,
          PasteManager: jest.fn() as any,
          DOMManager: createDOMManagerMock(),
          HistoryManager: jest.fn() as any,
          style: "background: #f0f0f0;",
          classes: "columns-class",
          attributes: "",
          columns: [
            {
              blox: [
                new Blox({
                  id: "2",
                  content: "Column 1",
                  type: BLOCK_TYPES.text,
                  onUpdate: jest.fn(),
                  TypingManager: jest.fn() as any,
                  StyleManager: jest.fn() as any,
                  PasteManager: jest.fn() as any,
                  DOMManager: createDOMManagerMock(),
                  HistoryManager: jest.fn() as any,
                  style: "",
                  classes: "",
                }),
              ],
            },
            {
              blox: [
                new Blox({
                  id: "3",
                  content: "Column 2",
                  type: BLOCK_TYPES.text,
                  onUpdate: jest.fn(),
                  TypingManager: jest.fn() as any,
                  StyleManager: jest.fn() as any,
                  PasteManager: jest.fn() as any,
                  DOMManager: createDOMManagerMock(),
                  HistoryManager: jest.fn() as any,
                  style: "",
                  classes: "",
                }),
              ],
            },
          ],
        }),
      ];

      const result = domManager.blocksToHTML(blocks);

      expect(result).toBe(
        '<div data-tbx-block="columns" style="background: #f0f0f0; " class="columns-class "><div class="tbx-columns" style="display: flex; gap: 1em;"><div class="tbx-column" style="flex: 1;"><p style="" class="" >Column 1</p></div><div class="tbx-column" style="flex: 1;"><p style="" class="" >Column 2</p></div></div></div>',
      );
    });

    it("should convert nested column blocks to HTML", () => {
      const blocks: Blox[] = [
        new Blox({
          id: "1",
          content: "",
          type: BLOCK_TYPES.columns,
          onUpdate: jest.fn(),
          TypingManager: jest.fn() as any,
          StyleManager: jest.fn() as any,
          PasteManager: jest.fn() as any,
          DOMManager: createDOMManagerMock(),
          HistoryManager: jest.fn() as any,
          style: "background: #f0f0f0;",
          classes: "columns-class",
          attributes: "",
          columns: [
            {
              blox: [
                new Blox({
                  id: "2",
                  content: "Column 1",
                  type: BLOCK_TYPES.text,
                  onUpdate: jest.fn(),
                  TypingManager: jest.fn() as any,
                  StyleManager: jest.fn() as any,
                  PasteManager: jest.fn() as any,
                  DOMManager: createDOMManagerMock(),
                  HistoryManager: jest.fn() as any,
                  style: "",
                  classes: "",
                }),
              ],
            },
            {
              blox: [
                new Blox({
                  id: "3",
                  content: "Column 2",
                  type: BLOCK_TYPES.columns, // Nested columns
                  onUpdate: jest.fn(),
                  TypingManager: jest.fn() as any,
                  StyleManager: jest.fn() as any,
                  PasteManager: jest.fn() as any,
                  DOMManager: createDOMManagerMock(),
                  HistoryManager: jest.fn() as any,
                  style: "background: #e0e0e0;",
                  classes: "nested-columns",
                  attributes: "",
                  columns: [
                    {
                      blox: [
                        new Blox({
                          id: "4",
                          content: "Nested Column 1",
                          type: BLOCK_TYPES.text,
                          onUpdate: jest.fn(),
                          TypingManager: jest.fn() as any,
                          StyleManager: jest.fn() as any,
                          PasteManager: jest.fn() as any,
                          DOMManager: createDOMManagerMock(),
                          HistoryManager: jest.fn() as any,
                          style: "",
                          classes: "",
                        }),
                      ],
                    },
                    {
                      blox: [
                        new Blox({
                          id: "5",
                          content: "Nested Column 2",
                          type: BLOCK_TYPES.text,
                          onUpdate: jest.fn(),
                          TypingManager: jest.fn() as any,
                          StyleManager: jest.fn() as any,
                          PasteManager: jest.fn() as any,
                          DOMManager: createDOMManagerMock(),
                          HistoryManager: jest.fn() as any,
                          style: "",
                          classes: "",
                        }),
                      ],
                    },
                  ],
                }),
              ],
            },
          ],
        }),
      ];

      const result = domManager.blocksToHTML(blocks);

      expect(result).toBe(
        '<div data-tbx-block="columns" style="background: #f0f0f0; " class="columns-class "><div class="tbx-columns" style="display: flex; gap: 1em;"><div class="tbx-column" style="flex: 1;"><p style="" class="" >Column 1</p></div><div class="tbx-column" style="flex: 1;"><div data-tbx-block="columns" style="background: #e0e0e0; " class="nested-columns "><div class="tbx-columns" style="display: flex; gap: 1em;"><div class="tbx-column" style="flex: 1;"><p style="" class="" >Nested Column 1</p></div><div class="tbx-column" style="flex: 1;"><p style="" class="" >Nested Column 2</p></div></div></div></div></div></div>',
      );
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
      if (document.activeElement)
        (document.activeElement as HTMLElement).blur();
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

    it("should parse video into a block", () => {
      const htmlString =
        '<p class="abcd">Hello</p><img style="width: 300px" src="image.png" title="abcd" /><iframe width="560" height="315" src="https://www.youtube.com/embed/koqBd2H6UqU?si=p9BZVH_k6pS-8i_a" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><p data-tbx-block="video" style="" ><iframe src="https://www.youtube.com/embed/koqBd2H6UqU?si=p9BZVH_k6pS-8i_a" style="color: red;" class="example-class" ></iframe></p>';

      // Call the method
      const blocks = domManager.parseHTMLToBlocks(htmlString);

      // Verify createBlox was called four times (twice per element)
      expect(mockBloxManager.createBlox).toHaveBeenCalledTimes(4);

      // Verify the fourth call (specific block for <img>)
      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(3, {
        id: expect.any(String), // Generated ID
        type: BLOCKS_SETTINGS.video.blockName,
        content:
          "https://www.youtube.com/embed/koqBd2H6UqU?si=p9BZVH_k6pS-8i_a",
        style: null,
        classes: null,
        attributes: 'width="560"; height="315"; title="YouTube video player"',
      });

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(4, {
        id: expect.any(String), // Generated ID
        type: BLOCKS_SETTINGS.video.blockName,
        content:
          "https://www.youtube.com/embed/koqBd2H6UqU?si=p9BZVH_k6pS-8i_a",
        style: "color: red;",
        classes: "example-class",
        attributes: "",
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

    it("should handle multiple attributes correctly", () => {
      const htmlString =
        '<p class="container" style="color: red" data-test="value" id="unique">Content</p>';

      // Call the method
      const blocks = domManager.parseHTMLToBlocks(htmlString);

      // Verify createBlox was called once
      expect(mockBloxManager.createBlox).toHaveBeenCalledTimes(1);

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(1, {
        id: expect.any(String),
        type: BLOCKS_SETTINGS.text.blockName,
        content: "Content",
        style: "color: red",
        classes: "container",
        attributes: 'data-test="value"; id="unique"',
      });
    });

    it("should handle predefined block type by attribute", () => {
      const htmlString =
        '<div data-tbx-block="image"><img src="image.png" data-tbx-alignment="center" style="margin: auto"/></div>';

      // Call the method
      const blocks = domManager.parseHTMLToBlocks(htmlString);

      // Verify createBlox was called once
      expect(mockBloxManager.createBlox).toHaveBeenCalledTimes(1);

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(1, {
        id: expect.any(String),
        type: BLOCKS_SETTINGS.image.blockName,
        content: "image.png",
        attributes: 'data-tbx-alignment="center"',
        classes: null,
        style: "margin: auto",
      });
    });

    it("should parse block attributes correctly", () => {
      const htmlString =
        '<div data-tbx-block="image"><img src="image.png" data-tbx-alignment="center" style="margin: auto"/></div>';
      const blocks = domManager.parseHTMLToBlocks(htmlString);

      expect(mockBloxManager.createBlox).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: 'data-tbx-alignment="center"', // Correct attributes parsed
          style: "margin: auto", // Correct style attribute
        }),
      );
    });

    it("should create empty blocks when no child content is found", () => {
      const htmlString =
        "<div data-tbx-block='columns'><div class='tbx-columns'><div class='tbx-column'></div></div></div>";
      const blocks = domManager.parseHTMLToBlocks(htmlString);

      // Check if an empty block was created for an empty column
      expect(mockBloxManager.createBlox).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          type: BLOCK_TYPES.text, // or whatever default block type you use
          content: "", // empty content for the block
        }),
      );
    });

    it("should parse columns correctly", () => {
      const htmlString =
        "<div data-tbx-block='columns'><div class='tbx-columns'><div class='tbx-column'><p>Text</p></div><div class='tbx-column'><p>Text2</p></div></div></div>";
      const blocks = domManager.parseHTMLToBlocks(htmlString);

      expect(mockBloxManager.createBlox).toHaveBeenCalledTimes(3); // One for the column, one for the block inside
      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          type: BLOCK_TYPES.columns, // Correct block type for columns
          content: "", // Empty content for columns block
        }),
      );

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          type: BLOCK_TYPES.text, // Correct block type for text
          content: "Text", // Content inside the column
        }),
      );

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          type: BLOCK_TYPES.text, // Correct block type for text
          content: "Text2", // Content inside the column
        }),
      );
    });

    it("should parse nested columns correctly", () => {
      const htmlString = `
        <div data-tbx-block='columns'>
          <div class='tbx-columns'>
            <div class='tbx-column'>
              <p>Column 1 Content</p>
            </div>
            <div class='tbx-column'>
              <div data-tbx-block='columns'>
                <div class='tbx-columns'>
                  <div class='tbx-column'>
                    <p>Nested Column 1 Content</p>
                  </div>
                  <div class='tbx-column'>
                    <p>Nested Column 2 Content</p>
                  </div>
                </div>
              </div>
              <p>Column 2 Content</p>
            </div>
          </div>
        </div>
      `;

      const blocks = domManager.parseHTMLToBlocks(htmlString);

      expect(mockBloxManager.createBlox).toHaveBeenCalledTimes(6);

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          type: BLOCK_TYPES.columns, // Correct block type for text
          content: "", // Content inside the column
        }),
      );

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          type: BLOCK_TYPES.text, // Correct block type for text
          content: "Column 1 Content", // Content inside the column
        }),
      );

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          type: BLOCK_TYPES.columns, // Correct block type for text
          content: "", // Content inside the column
        }),
      );

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({
          type: BLOCK_TYPES.text, // Correct block type for text
          content: "Nested Column 1 Content", // Content inside the column
        }),
      );

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(
        5,
        expect.objectContaining({
          type: BLOCK_TYPES.text, // Correct block type for text
          content: "Nested Column 2 Content", // Content inside the column
        }),
      );

      expect(mockBloxManager.createBlox).toHaveBeenNthCalledWith(
        6,
        expect.objectContaining({
          type: BLOCK_TYPES.text, // Correct block type for text
          content: "Column 2 Content", // Content inside the column
        }),
      );
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
          '<div id="parent"><p>Hello <b>world</b></p><p></p></div>',
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
        expectedHTML: `<ul id="list"><li>Item 1</li><li></li><li>Item 2</li></ul>`,
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
            domManager.addElement.call(context, selector, "after"),
          ).toThrowError();
        } else {
          const newElement = domManager.addElement.call(
            context,
            selector,
            "after",
          );

          // Assert the new element
          expect(newElement?.tagName.toLowerCase()).toBe(selector); // Ensure it's an <li>
          expect(newElement?.innerHTML).toBe(""); // Ensure it contains a non-breaking space

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
