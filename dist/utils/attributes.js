import { allowedAttributes } from "../constants";
export function extractElementAttributes(element) {
    // Extract and format styles into a CSS string
    const style = element.getAttribute("style")
        ? element
            .getAttribute("style")
            .split(";")
            .map((style) => {
            const [key, value] = style.split(":").map((s) => s.trim());
            if (key && value) {
                const camelCaseKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                return `${camelCaseKey}: ${value};`;
            }
            return null;
        })
            .filter(Boolean)
            .join(" ")
        : null;
    // Extract and format classes as a space-separated string
    const classes = element.getAttribute("class")
        ? element.getAttribute("class").split(/\s+/).filter(Boolean).join(" ")
        : null;
    return { style, classes };
}
export const getAllowedAttributes = (element) => {
    return Array.from(element.attributes)
        .filter((attr) => allowedAttributes.includes(attr.name))
        .map((attr) => `${attr.name}="${attr.value}"`)
        .join("; ");
};
