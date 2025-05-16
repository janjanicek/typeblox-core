import { Blox } from "../../../classes/Blox";

type PartialBloxProps = Partial<ConstructorParameters<typeof Blox>[0]>;

export function createMockBlox(overrides: PartialBloxProps = {}): Blox {
  const defaultProps = {
    id: "mock-id",
    type: "text",
    content: "",
    onUpdate: jest.fn(),
    TypingManager: {} as any,
    StyleManager: { updateCurrentStyles: jest.fn() } as any,
    PasteManager: {} as any,
    DOMManager: {} as any,
    HistoryManager: {} as any,
    ...overrides,
  };

  return new Blox(defaultProps);
}
