import { PasteManager } from "../PasteManager";
import { DOMManager } from "../DOMManager";
import { BloxManager } from "../BloxManager";
import { createMockBlox } from "./mocks/CreateBloxMock";

describe("PasteManager", () => {
  let pasteManager: PasteManager;
  let mockDOMManager: jest.Mocked<DOMManager>;
  let mockBloxManager: jest.Mocked<BloxManager>;

  beforeEach(() => {
    mockDOMManager = {
      sanitizeHTML: jest.fn(),
      parseHTMLToBlocks: jest.fn(),
    } as unknown as jest.Mocked<DOMManager>;
    mockBloxManager = {
      getBlox: jest.fn(),
      getCurrentBlock: jest.fn(),
      setBlox: jest.fn(),
      updateBlock: jest.fn(),
    } as unknown as jest.Mocked<BloxManager>;

    pasteManager = new PasteManager(mockDOMManager, mockBloxManager);
  });

  it("does nothing when clipboardData has no html or text", () => {
    const e = {
      preventDefault: jest.fn(),
      clipboardData: {
        getData: jest.fn().mockReturnValueOnce(""),
      },
    } as unknown as ClipboardEvent;

    pasteManager.pasteContent(e);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(mockDOMManager.sanitizeHTML).not.toHaveBeenCalled();
    expect(mockDOMManager.parseHTMLToBlocks).not.toHaveBeenCalled();
    expect(mockBloxManager.setBlox).not.toHaveBeenCalled();
  });

  it("inserts multiple new blocks after the current block", () => {
    const html = "<p>one</p><p>two</p>";
    const cleaned = html;
    const firstBlock = { id: "a" } as any;
    const secondBlock = { id: "b" } as any;

    mockDOMManager.sanitizeHTML.mockReturnValue(cleaned);
    mockDOMManager.parseHTMLToBlocks.mockReturnValue([firstBlock, secondBlock]);

    const existingBlock = { id: "x" } as any;
    mockBloxManager.getBlox.mockReturnValue([existingBlock]);
    mockBloxManager.getCurrentBlock.mockReturnValue(existingBlock);

    const e = {
      preventDefault: jest.fn(),
      clipboardData: { getData: jest.fn().mockReturnValue(html) },
    } as unknown as ClipboardEvent;

    pasteManager.pasteContent(e);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(mockDOMManager.sanitizeHTML).toHaveBeenCalledWith(html);
    expect(mockDOMManager.parseHTMLToBlocks).toHaveBeenCalledWith(cleaned);
    expect(mockBloxManager.setBlox).toHaveBeenCalledWith([
      existingBlock,
      firstBlock,
      secondBlock,
    ]);
  });

  it("inserts single-block content into the DOM via range operations", () => {
    const html = "<p>single</p>";
    const cleaned = html;
    mockDOMManager.sanitizeHTML.mockReturnValue(cleaned);
    mockDOMManager.parseHTMLToBlocks.mockReturnValue([{ id: "only" }] as any[]);

    // Mock Range and Selection
    const deleteContents = jest.fn();
    const insertNode = jest.fn();
    const collapse = jest.fn();
    const removeAllRanges = jest.fn();
    const addRange = jest.fn();
    const fragment = {} as DocumentFragment;
    const createContextualFragment = jest.fn().mockReturnValue(fragment);

    const range = {
      deleteContents,
      createContextualFragment,
      insertNode,
      collapse,
    } as unknown as Range;
    const selection = {
      rangeCount: 1,
      getRangeAt: jest.fn().mockReturnValue(range),
      removeAllRanges,
      addRange,
    } as unknown as Selection;

    (window as any).getSelection = jest.fn().mockReturnValue(selection);

    const e = {
      preventDefault: jest.fn(),
      clipboardData: { getData: jest.fn().mockReturnValue(html) },
    } as unknown as ClipboardEvent;

    pasteManager.pasteContent(e);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(mockDOMManager.sanitizeHTML).toHaveBeenCalledWith(html);
    expect(mockDOMManager.parseHTMLToBlocks).toHaveBeenCalledWith(cleaned);

    expect(deleteContents).toHaveBeenCalled();
    expect(createContextualFragment).toHaveBeenCalledWith(cleaned);
    expect(insertNode).toHaveBeenCalledWith(fragment);
    expect(collapse).toHaveBeenCalledWith(false);
    expect(removeAllRanges).toHaveBeenCalled();
    expect(addRange).toHaveBeenCalledWith(range);
  });

  it("allows setting dependencies via setDependencies", () => {
    pasteManager = new PasteManager();
    pasteManager.setDependencies(mockDOMManager, mockBloxManager);

    const html = "foo";
    mockDOMManager.sanitizeHTML.mockReturnValue(html);
    mockDOMManager.parseHTMLToBlocks.mockReturnValue([] as any[]);

    const e = {
      preventDefault: jest.fn(),
      clipboardData: { getData: jest.fn().mockReturnValue(html) },
    } as unknown as ClipboardEvent;

    expect(() => pasteManager.pasteContent(e)).not.toThrow();
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it("wraps inline siblings between blocks into one block", () => {
    const htmlString =
      '<h2 id="Etymology">Etymology</h2>See also: <a href="https://en.wikipedia.org/wiki/Nicknames_of_New_York_City" title="Nicknames of New York City">Nicknames of New York City</a><p>In 1664, New York was named in honor of the Duke of York.</p>';

    const sanitized = htmlString;
    // Fake blocks your parser should produce after batching inline nodes:
    const headingBlock = createMockBlox({
      id: "block1",
      type: "headline2",
      content: "Etymology",
      attributes: 'id="Etymology"',
    });

    const inlineBlock = createMockBlox({
      id: "block2",
      type: "text",
      content:
        'See also: <a href="https://en.wikipedia.org/wiki/Nicknames_of_New_York_City" title="Nicknames of New York City">Nicknames of New York City</a>',
    });

    const paragraphBlock = createMockBlox({
      id: "block3",
      type: "text",
      content: "In 1664, New York was named in honor of the Duke of York.",
    });

    mockDOMManager.sanitizeHTML.mockReturnValue(sanitized);
    mockDOMManager.parseHTMLToBlocks.mockReturnValue([
      headingBlock,
      inlineBlock,
      paragraphBlock,
    ]);

    const existingBlock = { id: "existing" } as any;
    mockBloxManager.getBlox.mockReturnValue([existingBlock]);
    mockBloxManager.getCurrentBlock.mockReturnValue(existingBlock);

    const e = {
      preventDefault: jest.fn(),
      clipboardData: {
        getData: jest.fn().mockReturnValueOnce(htmlString),
      },
    } as unknown as ClipboardEvent;

    pasteManager.pasteContent(e);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(mockDOMManager.sanitizeHTML).toHaveBeenCalledWith(htmlString);
    expect(mockDOMManager.parseHTMLToBlocks).toHaveBeenCalledWith(
      expect.stringContaining("See also: <a href="),
    );
    expect(mockBloxManager.setBlox).toHaveBeenCalledWith([
      existingBlock,
      headingBlock,
      inlineBlock,
      paragraphBlock,
    ]);
  });
});
