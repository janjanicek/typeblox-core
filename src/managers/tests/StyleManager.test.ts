/**
 * @jest-environment jsdom
 */
import { StyleManager } from "../StyleManager";
import { DOMManager } from "../DOMManager";
import { TypingManager } from "../TypingManager";
import { LinkManager } from "../LinkManager";

describe("StyleManager", () => {
  let styleManager: StyleManager;
  let mockTypingManager: jest.Mocked<TypingManager>;
  let mockDOMManager: jest.Mocked<DOMManager>;
  let mockLinkManager: jest.Mocked<LinkManager>;

  let mockRange: Range;
  let mockSelection: Selection;

  const setupMockSelection = (targetElement: HTMLElement) => {
    mockRange = document.createRange();
    mockRange.selectNodeContents(targetElement);

    mockSelection = {
      rangeCount: 1,
      getRangeAt: jest.fn(() => mockRange),
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
      toString: jest.fn(() => targetElement.textContent?.trim()),
    } as unknown as Selection;

    jest.spyOn(window, "getSelection").mockReturnValue(mockSelection);
    mockTypingManager.getSelectedElement.mockReturnValue(targetElement);
  };

  beforeEach(() => {
    // Mock TypingManager
    mockTypingManager = {
      getSelectedElement: jest.fn(),
      getCursorElement: jest.fn(),
      splitContentBySelected: jest.fn(),
      selectAllTextInSelectedElement: jest.fn(),
      saveSelection: jest.fn(),
      restoreSelection: jest.fn(),
      mergeConsecutiveStyledElements: jest.fn(),
    } as unknown as jest.Mocked<TypingManager>;

    // Mock DOMManager
    mockDOMManager = {
      getBlockElement: jest.fn(),
      removeElement: jest.fn(),
    } as unknown as jest.Mocked<DOMManager>;

    mockLinkManager = {
      findClosestAnchor: jest.fn(),
    } as unknown as jest.Mocked<LinkManager>;

    // Initialize FormatManager with mocks
    styleManager = new StyleManager();
    styleManager.setDependencies(
      mockDOMManager,
      mockTypingManager,
      mockLinkManager,
    );
  });

  describe("applyFormat", () => {
    it("should not apply format if no contentElement is found", () => {
      mockDOMManager.getBlockElement.mockReturnValue(null);

      styleManager.applyFormat("b");

      expect(mockDOMManager.getBlockElement).toHaveBeenCalled();
      expect(mockTypingManager.getSelectedElement).not.toHaveBeenCalled();
    });

    it("should not apply format if no selectedElement is found", () => {
      const mockContentElement = document.createElement("div");
      mockDOMManager.getBlockElement.mockReturnValue(mockContentElement);
      mockTypingManager.getSelectedElement.mockReturnValue(null);

      styleManager.applyFormat("b");

      expect(mockDOMManager.getBlockElement).toHaveBeenCalled();
      expect(mockTypingManager.getSelectedElement).not.toHaveBeenCalled();
    });

    it("should wrap the selected text with a tag and apply styles", () => {
      const mockContentElement = document.createElement("div");
      const mockSelectedElement = document.createElement("span");
      mockSelectedElement.textContent = "Sample Text";

      setupMockSelection(mockSelectedElement);

      mockDOMManager.getBlockElement.mockReturnValue(mockContentElement);
      mockTypingManager.getSelectedElement.mockReturnValue(mockSelectedElement);

      const parentElement = document.createElement("div");
      parentElement.appendChild(mockSelectedElement);

      styleManager.applyFormat("b", { color: "red" });

      const wrapper = parentElement.querySelector("b");
      expect(wrapper).not.toBeNull();
      expect(wrapper!.style.color).toBe("red");
      expect(wrapper!.textContent).toBe("Sample Text");
    });
  });

  describe("unapplyFormat", () => {
    it("should not unapply format if no selectedElement is found", () => {
      mockTypingManager.getSelectedElement.mockReturnValue(null);

      styleManager.unapplyFormat("b");

      expect(mockTypingManager.getSelectedElement).toHaveBeenCalled();
    });

    it("should remove a matching parent tag", () => {
      const mockSelectedElement = document.createElement("span");
      const mockParentElement = document.createElement("b");
      mockParentElement.appendChild(mockSelectedElement);
      document.body.appendChild(mockParentElement);

      styleManager.unapplyAliases = jest.fn();

      mockTypingManager.getSelectedElement.mockReturnValue(mockSelectedElement);
      styleManager.unapplyFormat("b");
      expect(mockDOMManager.removeElement).toHaveBeenCalledWith(
        mockParentElement,
      );
      expect(styleManager.unapplyAliases).toHaveBeenCalledWith("b");
    });

    it("should remove a specific style from a matching parent element", () => {
      const mockSelectedElement = document.createElement("span");
      const mockParentElement = document.createElement("b");
      mockParentElement.style.color = "red";
      mockParentElement.appendChild(mockSelectedElement);
      document.body.appendChild(mockParentElement);

      mockTypingManager.getSelectedElement.mockReturnValue(mockSelectedElement);

      styleManager.unapplyFormat("b", "color");

      expect(mockParentElement.style.color).toBe("");
    });
  });

  describe("getStyle", () => {
    it("should return default styles if no selection is found", () => {
      mockTypingManager.getSelectedElement.mockReturnValue(null);

      const styles = styleManager.getStyle();

      expect(styles).toEqual({
        color: null,
        backgroundColor: null,
        isBold: false,
        isItalic: false,
        isLink: false,
        isUnderline: false,
        isStrikeout: false,
        fontFamily: null,
        isH1: false,
        isH2: false,
        isH3: false,
        isParagraph: false,
        isCode: false,
        textAlign: "left",
      });
    });

    it("should detect bold style", () => {
      const mockSelectedElement = document.createElement("span");
      mockSelectedElement.style.fontWeight = "bold";

      mockTypingManager.getCursorElement.mockReturnValue(mockSelectedElement);

      const styles = styleManager.getStyle();

      expect(styles.isBold).toBe(true);
    });

    it("should detect bold style when wrapped in a <strong> tag", () => {
      const mockSelectedElement = document.createElement("strong");
      mockSelectedElement.textContent = "Bold Text";

      mockTypingManager.getCursorElement.mockReturnValue(mockSelectedElement);

      const styles = styleManager.getStyle();

      expect(styles.isBold).toBe(true);
    });

    it("should detect bold style when <b> is selected within a parent element", () => {
      const mockParentElement = document.createElement("div");
      const mockBoldElement = document.createElement("b");
      mockBoldElement.textContent = "Bold Text";

      mockParentElement.appendChild(mockBoldElement);
      document.body.appendChild(mockParentElement);

      // Mock the window.getSelection behavior
      const mockRange = document.createRange();
      mockRange.selectNodeContents(mockBoldElement);

      const mockSelection = {
        rangeCount: 1,
        getRangeAt: jest.fn(() => mockRange),
        toString: jest.fn(() => mockBoldElement.textContent),
      };

      jest
        .spyOn(window, "getSelection")
        .mockReturnValue(mockSelection as unknown as Selection);

      mockTypingManager.getCursorElement.mockReturnValue(mockBoldElement);

      const styles = styleManager.getStyle();

      expect(styles.isBold).toBe(true);
    });

    it("should detect bold style when wrapped in a <b> tag", () => {
      const mockSelectedElement = document.createElement("b");
      mockSelectedElement.textContent = "Bold Text";

      mockTypingManager.getCursorElement.mockReturnValue(mockSelectedElement);

      const styles = styleManager.getStyle();

      expect(styles.isBold).toBe(true);
    });

    it("should detect bold style if a parent element is <b>", () => {
      const mockParentElement = document.createElement("b");
      const mockSelectedElement = document.createElement("span");
      mockSelectedElement.textContent = "Bold Text";

      mockParentElement.appendChild(mockSelectedElement);
      mockTypingManager.getCursorElement.mockReturnValue(mockSelectedElement);

      const styles = styleManager.getStyle();

      expect(styles.isBold).toBe(true);
    });

    it("should detect custom styles", () => {
      const mockSelectedElement = document.createElement("span");
      mockSelectedElement.style.color = "blue";
      mockSelectedElement.style.fontStyle = "italic";

      mockTypingManager.getCursorElement.mockReturnValue(mockSelectedElement);

      const styles = styleManager.getStyle();

      expect(styles.color).toBe("blue");
      expect(styles.isItalic).toBe(true);
    });
  });

  describe("clearFormat", () => {
    let container: HTMLElement;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should remove all formatting tags while preserving text content", () => {
      container.innerHTML = `
        <p>
          <b>Bold</b> and <i>Italic</i> text with <u>Underline</u>.
        </p>
      `;
      const paragraph = container.querySelector("p") as HTMLElement;
      setupMockSelection(paragraph);

      styleManager.clearFormat();

      const normalizedOutput = container.innerHTML.replace(/\s+/g, " ").trim();
      const expectedOutput = "<p> Bold and Italic text with Underline. </p>";

      expect(normalizedOutput).toBe(expectedOutput);
    });

    it("should handle nested formatting tags", () => {
      container.innerHTML = `
        <p>
          <b><u>Bold and Underlined</u></b> text.
        </p>
      `;
      const paragraph = container.querySelector("p") as HTMLElement;
      setupMockSelection(paragraph);

      styleManager.clearFormat();

      const normalizedOutput = container.innerHTML.replace(/\s+/g, " ").trim();
      const expectedOutput = "<p> Bold and Underlined text. </p>";

      expect(normalizedOutput).toBe(expectedOutput);
    });

    it("should remove inline styles", () => {
      container.innerHTML = `
        <p>
          <span style="color: red;">Red Text</span> and <mark>highlighted text</mark>.
        </p>
      `;
      const paragraph = container.querySelector("p") as HTMLElement;
      setupMockSelection(paragraph);

      styleManager.clearFormat();

      const normalizedOutput = container.innerHTML.replace(/\s+/g, " ").trim();
      const expectedOutput = "<p> Red Text and highlighted text. </p>";

      expect(normalizedOutput).toBe(expectedOutput);
    });

    it("should handle deeply nested elements", () => {
      container.innerHTML = `
        <div>
          <b><i><u>Deeply nested</u></i></b> text.
        </div>
      `;
      const div = container.querySelector("div") as HTMLElement;
      setupMockSelection(div);

      styleManager.clearFormat();

      const normalizedOutput = container.innerHTML.replace(/\s+/g, " ").trim();
      const expectedOutput = "<div> Deeply nested text. </div>";

      expect(normalizedOutput).toBe(expectedOutput);
    });

    it("should handle cases with no selected element", () => {
      mockTypingManager.getSelectedElement.mockReturnValue(null);
      mockTypingManager.getCursorElement.mockReturnValue(null);

      styleManager.clearFormat();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "No selected or cursor element found for clearing formatting.",
      );
    });

    it("should merge adjacent text nodes", () => {
      container.innerHTML = `
        <p>
          Part 1<span> Part 2</span> Part 3.
        </p>
      `;
      const paragraph = container.querySelector("p") as HTMLElement;
      setupMockSelection(paragraph);

      styleManager.clearFormat();

      const normalizedOutput = container.innerHTML.replace(/\s+/g, " ").trim();
      const expectedOutput = "<p> Part 1 Part 2 Part 3. </p>";

      expect(normalizedOutput).toBe(expectedOutput);
    });
  });
});
