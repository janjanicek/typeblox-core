import { BloxManager } from "../../BloxManager";
import { TypingManager } from "../../TypingManager";
import { EditorManager } from "../../EditorManager";
export const createDOMManagerMock = () => {
    return {
        // Mock dependencies that DOMManager relies on
        BloxManager: new BloxManager(() => { }),
        TypingManager: new TypingManager(),
        EditorManager: new EditorManager(),
        // Mock methods
        getBlockElement: jest.fn(),
        getBlockElementById: jest.fn(),
        removeElement: jest.fn(),
        sanitizeHTML: jest.fn(),
        blocksToHTML: jest.fn(),
        parseHTMLToBlocks: jest.fn(),
        splitElementBySelector: jest.fn(),
        addElement: jest.fn(),
        convertHTMLToJSON: jest.fn(),
        setDependencies: jest.fn(),
    };
};
