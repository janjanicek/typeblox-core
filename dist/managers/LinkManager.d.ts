interface LinkProps {
    href: string;
    target: string;
}
export declare class LinkManager {
    /**
     * Checks if an element is a YouTube iframe video
     * @param element The HTML element to check
     * @returns boolean indicating if the element is a YouTube iframe
     */
    isYouTubeIframeVideo(element: HTMLElement): boolean;
    findClosestAnchor(): HTMLAnchorElement | null;
    createLink(props: LinkProps): void;
    /** Update existing link or create one if it doesn't exist */
    updateLink(props: LinkProps): void;
    /** Remove link while keeping the text content */
    removeLink(): void;
    /** Get current selection link properties */
    getLinkProps(): LinkProps | null;
}
export {};
