export const toCssStyle = (jsStyleKey) => {
    return jsStyleKey === null || jsStyleKey === void 0 ? void 0 : jsStyleKey.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
};
