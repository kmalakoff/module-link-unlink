import assert from 'assert';

// @ts-ignore
import { linkModule, unlinkModule } from 'module-link-unlink';
// @ts-ignore
import linkUnlink from 'module-link-unlink';

describe('exports .ts', () => {
  it('defaults', () => {
    assert.equal(typeof linkUnlink.linkModule, 'function');
    assert.equal(typeof linkUnlink.unlinkModule, 'function');
  });
  it('linkModule', () => {
    assert.equal(typeof linkModule, 'function');
  });
  it('unlinkModule', () => {
    assert.equal(typeof unlinkModule, 'function');
  });
});
