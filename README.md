# go-text-template
[![Node.js CI](https://github.com/defang-io/go-text-template/actions/workflows/node.js.yml/badge.svg)](https://github.com/defang-io/go-text-template/actions/workflows/node.js.yml)
![npm](https://img.shields.io/npm/v/go-text-template)

Basic Go text/template parser and renderer.

## Usage
```js
import { Template } from 'go-text-template'; // or require
const template = new Template("optional name");
const output = template.execute('Hello {{.name}}', { name: 'World' });
console.log(output); // Hello World
```
