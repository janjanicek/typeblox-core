/**
 * @jest-environment jsdom
 */

import { Blox } from "../Blox";
import { TypingManager } from "../../managers/TypingManager";
import { StyleManager } from "../../managers/StyleManager";
import { PasteManager } from "../../managers/PasteManager";
import { HistoryManager } from "../../managers/HistoryManager";
import { DOMManager } from "../../managers/DOMManager";
import { EVENTS } from "../../constants";

jest.mock("../../managers/TypingManager");
jest.mock("../../managers/StyleManager");
jest.mock("../../managers/PasteManager");
jest.mock("../../managers/HistoryManager");

describe("Blox Class", () => {
  let blox: Blox;
  let mockOnUpdate: jest.Mock;

  beforeEach(() => {
    mockOnUpdate = jest.fn();
    blox = new Blox({
      id: "test-id",
      content: "Initial content",
      type: "text",
      onUpdate: mockOnUpdate,
      TypingManager: new TypingManager(),
      StyleManager: new StyleManager(),
      PasteManager: new PasteManager(),
      DOMManager: new DOMManager(),
      HistoryManager: new HistoryManager(),
      style: "color: red; font-size: 16px",
      classes: "class1 class2",
    });

    const mockElement = document.createElement("div");
    mockElement.setAttribute("data-typeblox-id", "test-id");
    document.body.appendChild(mockElement);
    blox.contentElement = mockElement;
  });

  describe("Style Methods", () => {
    test("getStyles should return styles as an object", () => {
      expect(blox.getStyles()).toEqual({
        color: "red",
        fontSize: "16px",
      });
    });

    test("getStyles should return value of specific style", () => {
      expect(blox.getStyles().color).toEqual("red");
    });

    test("setStyle should update a single style", () => {
      blox.setStyle("background-color", "blue");
      expect(blox.styles).toContain("background-color: blue");
    });

    test("setStyles should update multiple styles", () => {
      blox.setStyles({
        color: "green",
        "font-weight": "bold",
      });
      expect(blox.styles).toContain("color: green");
      expect(blox.styles).toContain("font-weight: bold");
    });

    test("removeStyle should remove a specific style", () => {
      blox.removeStyle("color");
      expect(blox.styles).not.toContain("color: red");
    });

    test("clearStyles should remove all styles", () => {
      blox.clearStyles();
      expect(blox.styles).toBe("");
    });

    test("toggleStyle should toggle a style", () => {
      blox.toggleStyle("font-size", "16px");
      expect(blox.styles).not.toContain("font-size: 16px");

      blox.toggleStyle("font-size", "16px");
      expect(blox.styles).toContain("font-size: 16px");
    });
  });

  describe("Class Methods", () => {
    test("getClasses should return classes as an array", () => {
      expect(blox.getClasses()).toEqual(["class1", "class2"]);
    });

    test("addClass should add a class", () => {
      blox.addClass("class3");
      expect(blox.classes).toContain("class3");
    });

    test("removeClass should remove a class", () => {
      blox.removeClass("class1");
      expect(blox.classes).not.toContain("class1");
    });

    test("hasClass should check if a class exists", () => {
      expect(blox.hasClass("class1")).toBe(true);
      expect(blox.hasClass("class3")).toBe(false);
    });

    test("clearClasses should remove all classes", () => {
      blox.clearClasses();
      expect(blox.classes).toBe("");
    });

    test("toggleClass should toggle a class", () => {
      blox.toggleClass("class1");
      expect(blox.classes).not.toContain("class1");

      blox.toggleClass("class1");
      expect(blox.classes).toContain("class1");
    });
  });

  describe("Event Emission", () => {
    test("should emit styleChange event on style updates", () => {
      const emitSpy = jest.spyOn(blox, "emit");
      blox.setStyle("color", "blue");
      expect(emitSpy).toHaveBeenCalledWith(EVENTS.blocksChanged);
    });

    test("should emit styleChange event on class updates", () => {
      const emitSpy = jest.spyOn(blox, "emit");
      blox.addClass("class3");
      expect(emitSpy).toHaveBeenCalledWith(EVENTS.styleChange);
    });
  });

  describe("setContent Method", () => {
    test("should update content when type is 'text' and parse HTML", () => {
      const contentString = "<p><strong>Test</strong> content</p>";
      blox.setContent(contentString);

      expect(blox.content).toBe("<p><strong>Test</strong> content</p>");
      expect(blox.contentElement?.innerHTML).toBe(
        "<p><strong>Test</strong> content</p>",
      );
    });

    test("should update content when type is 'image' and set src", () => {
      blox.type = "image";
      const imageUrl = "https://example.com/image.jpg";
      const imageElement = document.createElement("img");
      blox.contentElement = imageElement;

      blox.setContent(imageUrl);

      expect(blox.content).toBe(imageUrl);
      expect(imageElement.src).toBe(imageUrl);
    });

    test("should handle nested lists and preserve <li> elements", () => {
      const contentString =
        "<ul><li>Item 1</li><li>Item 2</li></ul><li>Item 3</li>";
      blox.setContent(contentString);

      expect(blox.content).toBe(
        "<ul><li>Item 1</li><li>Item 2</li></ul><li>Item 3</li>",
      );
      expect(blox.contentElement?.innerHTML).toBe(
        "<ul><li>Item 1</li><li>Item 2</li></ul><li>Item 3</li>",
      );
    });

    test("should handle missing wrapper tag and preserve content as is", () => {
      const contentString = "<div><p><strong>Text</strong></p></div>";
      blox.type = "text"; // Ensure it's not an image type

      // Mock the contentElement to simulate actual DOM manipulation
      blox.contentElement = document.createElement("div");

      blox.setContent(contentString);

      expect(blox.content).toBe("<div><p><strong>Text</strong></p></div>");
      expect(blox.contentElement.innerHTML).toBe(
        "<div><p><strong>Text</strong></p></div>",
      );
    });

    test("should correctly update content when no wrapper tag is set", () => {
      const contentString = "<div><p><strong>Sample content</strong></p></div>";
      blox.type = "text";
      blox.setContent(contentString);

      expect(blox.content).toBe(
        "<div><p><strong>Sample content</strong></p></div>",
      );
      expect(blox.contentElement?.innerHTML).toBe(
        "<div><p><strong>Sample content</strong></p></div>",
      );
    });

    test("should call sendUpdateBloxEvent after content update", () => {
      const sendUpdateSpy = jest.spyOn(blox, "sendUpdateBloxEvent");
      const contentString = "<p><strong>New content</strong></p>";

      blox.setContent(contentString);

      expect(sendUpdateSpy).toHaveBeenCalled();
    });
  });
});
