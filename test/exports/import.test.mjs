import assert from 'assert';
import linkUnlink, { linkModule, unlinkModule } from 'module-link-unlink';

describe('exports .mjs', () => {
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
