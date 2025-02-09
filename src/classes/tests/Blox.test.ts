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
});
