import { Extension } from "src/types";

export class ExtensionsManager {
  private registeredExtensions: Record<string, Extension>;

  constructor(extensions: Extension[] = []) {
    // Initialize registeredExtensions and populate it if extensions are provided
    this.registeredExtensions = {};
    extensions.forEach((extension) => this.registerExtension(extension));
  }

  /**
   * Registers a new extension.
   * @param extension The extension to register.
   */
  public registerExtension(extension: Extension): void {
    if (this.registeredExtensions[extension.name]) {
      console.warn(
        `Extension "${extension.name}" is already registered. Overwriting.`,
      );
    }
    this.registeredExtensions[extension.name] = extension;
  }

  /**
   * Retrieves an extension by name.
   * @param name The name of the extension to retrieve.
   * @returns The extension if found, otherwise null.
   */
  public getExtension(name: string): Extension | null {
    return this.registeredExtensions[name] || null;
  }

  /**
   * Retrieves all registered extensions.
   * @returns An array of all registered extensions.
   */
  public getAllExtensions(): Extension[] {
    return Object.values(this.registeredExtensions);
  }
}
