import { Extension } from "src/types";
export declare class ExtensionsManager {
    private registeredExtensions;
    constructor(extensions?: Extension[]);
    /**
     * Registers a new extension.
     * @param extension The extension to register.
     */
    registerExtension(extension: Extension): void;
    /**
     * Retrieves an extension by name.
     * @param name The name of the extension to retrieve.
     * @returns The extension if found, otherwise null.
     */
    getExtension(name: string): Extension | null;
    /**
     * Retrieves all registered extensions.
     * @returns An array of all registered extensions.
     */
    getAllExtensions(): Extension[];
}
