import { Blox } from "../../../classes/Blox";
export function createMockBlox(overrides = {}) {
    const defaultProps = Object.assign({ id: "mock-id", type: "text", content: "", onUpdate: jest.fn(), TypingManager: {}, StyleManager: { updateCurrentStyles: jest.fn() }, PasteManager: {}, DOMManager: {}, HistoryManager: {} }, overrides);
    return new Blox(defaultProps);
}
