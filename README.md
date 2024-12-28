## module-link-unlink

Link and unlink a module with saving and restoring the previous install

```typescript
import { linkModule, unlinkModule } from 'module-link-unlink';

// If '/path/to/node_modules/module' exists, it is moved to '/path/to/node_modules/module.abcde1234' and regardless '/path/to/module' -> '/path/to/node_modules/module'. All binaries are also linked in '/path/to/node_modules/.bin'
await link('/path/to/module', '/path/to/node_modules'); 

// if '/path/to/node_modules/module.abcde1234' exists, it is restored to '/path/to/node_modules/module' otherwise it will be removed including all accompanying binaries
await unlink('/path/to/module', '/path/to/node_modules'); 
```

### Documentation

[API Docs](https://kmalakoff.github.io/module-link-unlink/)
