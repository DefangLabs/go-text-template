# go-text-template
Basic Go text/template parser and renderer.

## Usage
```js
import { Template } from 'go-text-template'; // or require
const template = new Template("optional name");
const output = template.execute('Hello {{.name}}', { name: 'World' });
console.log(output); // Hello World
```
