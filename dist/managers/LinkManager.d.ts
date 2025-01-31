interface LinkProps {
    href: string;
    target: string;
}
export declare class LinkManager {
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
