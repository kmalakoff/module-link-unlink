# module-link-unlink

Link and unlink a module with saving and restoring the previous install

```sh
npm install module-link-unlink
```

The source directory must contain a `package.json`. Its `name` determines the
destination under `node_modules`, and its `bin` entries are linked under
`node_modules/.bin`.

In a CommonJS `.cjs` file:

```js
var moduleLinks = require('module-link-unlink');

// If '/path/to/node_modules/module' exists, it is moved to '/path/to/node_modules/module.abcde1234' and regardless '/path/to/module' -> '/path/to/node_modules/module'. All binaries are also linked in '/path/to/node_modules/.bin'
moduleLinks.linkModule('/path/to/module', '/path/to/node_modules', function (err) {
  if (err) throw err;

  // Restore the previous install, or remove this module and its binaries.
  moduleLinks.unlinkModule('/path/to/module', '/path/to/node_modules', function (err) {
    if (err) throw err;
  });
});
```

### Documentation

[API Docs](https://kmalakoff.github.io/module-link-unlink/)
