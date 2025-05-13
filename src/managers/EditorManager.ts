import { BLOCKS_SETTINGS } from "../blockTypes";
import { Blox } from "../classes/Blox";
import { BloxManager } from "./BloxManager";
import { TypingManager } from "./TypingManager";

export class EditorManager {
  private BloxManager: BloxManager | null = null;
  private TypingManager: TypingManager | null = null;
  public editorContainer: string | undefined = undefined;

  constructor(
    initialBloxManager?: BloxManager,
    initialTypingManager?: TypingManager,
    editorContainer?: string,
  ) {
    if (initialBloxManager) {
      this.BloxManager = initialBloxManager;
    }
    if (initialTypingManager) {
      this.TypingManager = initialTypingManager;
    }
    this.editorContainer = editorContainer;
  }

  setDependencies(BloxManager: BloxManager, TypingManager: TypingManager) {
    this.BloxManager = BloxManager;
    this.TypingManager = TypingManager;
  }

  public createEditorContent(editorContainer: string | undefined): void {
    if (!editorContainer) return;

    this.editorContainer = editorContainer;
    const editorElement = this.editorContainer
      ? document.querySelector(this.editorContainer)
      : null;
    if (!editorElement) return;
    const blocks = this.BloxManager?.getBlox();

    if (blocks)
      blocks.forEach((block: Blox) => {
        const blockSettings = BLOCKS_SETTINGS[block.type];
        if (blockSettings) {
          const blockElement = document.createElement(blockSettings.tag);
          blockElement.dataset.typebloxId = block.id;
          blockElement.dataset.typebloxEditor = "block";
          blockElement.setAttribute(
            "placeholder",
            BLOCKS_SETTINGS[block.type].placeholder,
          );
          blockElement.setAttribute("contenteditable", "true");
          blockElement.setAttribute("class", block.classes);
          blockElement.setAttribute("style", block.styles);

          const attributes = block.getAttributes();
          Object.entries(attributes).forEach(([key, value]) => {
            blockElement.setAttribute(key, value.toString());
          });

          blockElement.innerHTML = block.content;
          editorElement.append(blockElement);
        }
      });
  }

  public clearEditor = () => {
    if (!this.editorContainer) return;

    const editorElement = document.querySelector(this.editorContainer);
    if (editorElement) editorElement.innerHTML = "";
  };

  public refresh = () => {
    if (this.editorContainer) {
      this.clearEditor();
      this.createEditorContent(this.editorContainer);
    }
  };
}
