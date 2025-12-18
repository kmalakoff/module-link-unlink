import fs from 'fs';
import { link } from 'link-unlink';
import { Lock } from 'lock';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';

const lock = Lock();

function linkBin(src, binPath, nodeModules, binName, callback) {
  const binFullPath = path.join.apply(null, [src, ...binPath.split('/')]);
  const destBin = path.join(nodeModules, '.bin', binName);

  fs.stat(binFullPath, (err) => {
    if (!err) return link(binFullPath, destBin, callback);
    console.log(`bin not found: ${binFullPath}. Skipping`);
    callback();
  });
}

function worker(src, nodeModules, callback) {
  lock([src, nodeModules], (release) => {
    callback = release(callback);
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
      const dest = path.join.apply(null, [nodeModules, ...pkg.name.split('/')]);

      mkdirp(path.dirname(dest), (err) => {
        if (err) return callback(err);

        const queue = new Queue();
        queue.defer(link.bind(null, src, dest));

        if (typeof pkg.bin === 'string')
          queue.defer(linkBin.bind(null, src, pkg.bin, nodeModules, pkg.name)); // single bins
        else for (const binName in pkg.bin) queue.defer(linkBin.bind(null, src, pkg.bin[binName], nodeModules, binName)); // object of bins

        queue.await((err) => {
          err ? callback(err) : callback(null, dest);
        });
      });
    } catch (err) {
      return callback(err);
    }
  });
}

import type { LinkCallback } from './types.ts';

export default function linkModule(src: string, nodeModules: string, callback?: LinkCallback): void | Promise<string> {
  if (typeof callback === 'function') return worker(src, nodeModules, callback);
  return new Promise((resolve, reject) => worker(src, nodeModules, (err, restore?) => (err ? reject(err) : resolve(restore))));
}
