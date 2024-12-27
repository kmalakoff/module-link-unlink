const assert = require('assert');
const { linkModule, unlinkModule } = require('module-link-unlink');
const linkUnlink = require('module-link-unlink');

describe('exports .cjs', () => {
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
