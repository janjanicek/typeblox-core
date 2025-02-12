# typeblox-core

Headless block-based WYSIWYG Editor

## Installation

```bash
npm install @typeblox/core
```

## Usage

```
import { Typeblox } from "@typeblox/core";

const TypeBoxEditor = new Typeblox();

const content = "<h1>This is title</h1><p>This is a sample text</p>";

const onChange = () => {
    // your code for updating content
}

TypeBoxEditor.init({
HTMLString: content,
onUpdate: onChange,
extensions: [ // You can define your own modules
    {
    name: "newExtension",
    onClick: () => {
        (window as any).typebloxEditor?.blox().getCurrentBlock()?.toggleStyle('text-align', 'left');
    },
    isActive: () => (window as any).typebloxEditor?.style().getStyle().textAlign === "left",
    iconElement: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round">
        <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path>
        </svg>
    ),
    },
],
blocks: { // Apply some default styling to blocks
    headline1: {
    defaults: {
        styles: "color: red;"
    }
    },
    customBlock: { // Define custom block
    tag: "div",
    visibleName: "My block",
    blockName: "customBlock",
    description: "This is a sample block description",
    placeholder: "Write your content",
    iconElement: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round">
        <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path>
        </svg>
    ),
    }
}
});

console.log(TypeBoxEditor.blox().getBlox()); // To see instances of blocks

// Examples of operations

TypeBoxEditor.blox().getCurrentBlock()?.toggleBold(); //toggles the bold style on the selection text

TypeBoxEditor.blox().getCurrentBlock()?.toggleItalic(); //toggles the bold style on the selection

TypeBoxEditor.blox().getCurrentBlock()?.toggleType("headline1"); //change the type of the block to h1

TypeBoxEditor.format().clearFormat(); //clears the text style

```

## Features

- Lightweight utility library
- Easy integration into any project
- Provides core Typeblox functionalities

## License

This package is licensed under Apache License 2.0 + Commons Clause. See the License file.
