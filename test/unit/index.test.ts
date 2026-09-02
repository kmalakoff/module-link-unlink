import assert from 'assert';
import fs from 'fs';
import existsSync from 'fs-exists-sync';
// @ts-ignore
import { linkModule, unlinkModule } from 'module-link-unlink';
import path from 'path';
import Pinkie from 'pinkie-promise';
import rimraf2 from 'rimraf2';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', '..', 'node_modules');
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp');

const STRESS_COUNT = 10;

describe('module-link-unlink', () => {
  before(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));
  // after(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));

  function addTests({ name, type }) {
    function isType(stat) {
      return type === 'file' ? stat.isFile() : stat.isDirectory();
    }
    function checkFiles(files, count) {
      assert.equal(files.length, count);

      files.forEach((file) => {
        // correct types
        const lstat = fs.lstatSync(path.join(TMP_DIR, file));
        assert.ok(lstat.isSymbolicLink());
        const stat = fs.statSync(path.join(TMP_DIR, file));
        assert.ok(isType(stat));
        if (type === 'dir') {
          assert.equal(existsSync(path.join(TMP_DIR, file, 'package.json')), true);
        }
      });
    }

    describe(name, () => {
      (() => {
        // patch and restore promise
        if (typeof global === 'undefined') return;
        const globalPromise = global.Promise;
        before(() => {
          global.Promise = Pinkie;
        });
        after(() => {
          global.Promise = globalPromise;
        });
      })();

      it('linkModule', (done) => {
        const source = path.join(DATA, name);
        const dest = path.join(TMP_DIR, name);
        assert.equal(existsSync(dest), false);

        linkModule(source, TMP_DIR, (err, restore) => {
          if (err) {
            done(err.message);
            return;
          }
          assert.equal(restore, dest);
          assert.equal(existsSync(dest), true);
          checkFiles(fs.readdirSync(TMP_DIR), 1);

          // correct types
          const lstat = fs.lstatSync(dest);
          assert.ok(lstat.isSymbolicLink());
          const stat = fs.statSync(dest);
          assert.ok(isType(stat));
          unlinkModule(source, TMP_DIR, (err) => {
            if (err) {
              done(err.message);
              return;
            }
            assert.equal(existsSync(dest), false);
            assert.equal(fs.readdirSync(TMP_DIR).length, 0);
            done();
          });
        });
      });

      it('linkModule (promise)', async () => {
        const source = path.join(DATA, name);
        const dest = path.join(TMP_DIR, name);
        assert.equal(existsSync(dest), false);

        const restore = await linkModule(source, TMP_DIR);
        assert.equal(restore, dest);
        assert.equal(existsSync(dest), true);
        checkFiles(fs.readdirSync(TMP_DIR), 1);

        // correct types
        const lstat = fs.lstatSync(dest);
        assert.ok(lstat.isSymbolicLink());
        const stat = fs.statSync(dest);
        assert.ok(isType(stat));

        await unlinkModule(source, TMP_DIR);
        assert.equal(existsSync(dest), false);
        assert.equal(fs.readdirSync(TMP_DIR).length, 0);
      });

      it('link multiple (serial)', async () => {
        const source = path.join(DATA, name);
        const dest = path.join(TMP_DIR, name);
        assert.equal(existsSync(dest), false);

        for (let counter = 0; counter < STRESS_COUNT; counter++) {
          await linkModule(source, TMP_DIR);
        }
        assert.equal(existsSync(dest), true);
        checkFiles(fs.readdirSync(TMP_DIR), STRESS_COUNT);
        for (let counter = 0; counter < STRESS_COUNT; counter++) {
          await unlinkModule(source, TMP_DIR);
        }
        assert.equal(existsSync(dest), false);
        assert.equal(fs.readdirSync(TMP_DIR).length, 0);
      });

      it('link multiple (parallel)', async () => {
        const source = path.join(DATA, name);
        const dest = path.join(TMP_DIR, name);
        assert.equal(existsSync(dest), false);

        await Promise.all([...Array(STRESS_COUNT)].map((_) => linkModule(source, TMP_DIR)));
        assert.equal(existsSync(dest), true);
        checkFiles(fs.readdirSync(TMP_DIR), STRESS_COUNT);
        await Promise.all([...Array(STRESS_COUNT)].map((_) => unlinkModule(source, TMP_DIR)));
        assert.equal(existsSync(dest), false);
        assert.equal(fs.readdirSync(TMP_DIR).length, 0);
      });
    });
  }

  addTests({ name: 'link-unlink', type: 'dir' });
});
