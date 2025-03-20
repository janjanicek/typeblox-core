// __mocks__/DOMManagerMock.ts
import { DOMManager } from "../../DOMManager";
import { BloxManager } from "../../BloxManager";
import { TypingManager } from "../../TypingManager";
import { EditorManager } from "../../EditorManager";

export const createDOMManagerMock = (): jest.Mocked<DOMManager> => {
  return {
    // Mock dependencies that DOMManager relies on
    BloxManager: new BloxManager(() => {}) as jest.Mocked<BloxManager>,
    TypingManager: new TypingManager() as jest.Mocked<TypingManager>,
    EditorManager: new EditorManager() as jest.Mocked<EditorManager>,

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
  } as unknown as jest.Mocked<DOMManager>;
};
