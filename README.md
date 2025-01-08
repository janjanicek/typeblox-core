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
});

console.log(TypeBoxEditor.getBlocks()); // To see instances of blocks

```

```
<div id="typeblox-editor"></div>

```

## Features
* Lightweight utility library
* Easy integration into any project
* Provides core TypeBlox functionalities

## License
This package is licensed under the MIT License.
