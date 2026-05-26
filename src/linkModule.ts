import fs from 'fs';
import { link } from 'link-unlink';
import { Lock } from 'lock';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';

const lock = Lock();

import type { LinkCallback } from './types.ts';

function linkBin(src: string, binPath: string, nodeModules: string, binName: string, callback: LinkCallback) {
  const binFullPath = path.join.apply(null, [src, ...binPath.split('/')]);
  const destBin = path.join(nodeModules, '.bin', binName);

  fs.stat(binFullPath, (err) => {
    if (!err) return link(binFullPath, destBin, callback);
    console.log(`bin not found: ${binFullPath}. Skipping`);
    callback();
  });
}

function worker(src: string, nodeModules: string, callback: LinkCallback) {
  lock([src, nodeModules], (release) => {
    callback = release(callback);
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
      const dest = path.join.apply(null, [nodeModules, ...pkg.name.split('/')]);

      mkdirp(path.dirname(dest), (err) => {
        if (err) return callback(err);

        const queue = new Queue();
        queue.defer((cb) => link(src, dest, (err) => cb(err ?? undefined)));

        if (typeof pkg.bin === 'string') {
          const binName = pkg.name as string;
          const binPath = pkg.bin as string;
          queue.defer((cb) => linkBin(src, binPath, nodeModules, binName, (err) => cb(err ?? undefined)));
        } else {
          for (const binName in pkg.bin) {
            const bn = binName;
            const bp = pkg.bin[bn] as string;
            queue.defer((cb) => linkBin(src, bp, nodeModules, bn, (err) => cb(err ?? undefined)));
          }
        }

        queue.await((err) => {
          err ? callback(err) : callback(undefined, dest);
        });
      });
    } catch (err) {
      return callback(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

export default function linkModule(src: string, nodeModules: string, callback?: LinkCallback): void | Promise<string> {
  if (typeof callback === 'function') return worker(src, nodeModules, callback);
  return new Promise((resolve, reject) => worker(src, nodeModules, (err, restore?) => (err ? reject(err) : resolve(restore!))));
}
