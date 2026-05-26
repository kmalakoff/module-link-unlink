import fs from 'fs';
import { unlink } from 'link-unlink';
import { Lock } from 'lock';
import path from 'path';
import Queue from 'queue-cb';

const lock = Lock();

import type { UnlinkCallback } from './types.ts';

function unlinkBin(nodeModules: string, binName: string, callback: UnlinkCallback) {
  const destBin = path.join(nodeModules, '.bin', binName);

  fs.stat(destBin, (err) => {
    if (!err) return unlink(destBin, callback);
    console.log(`bin not found: ${destBin}. Skipping`);
    callback();
  });
}

function worker(src: string, nodeModules: string, callback: UnlinkCallback) {
  lock([src, nodeModules], (release) => {
    callback = release(callback);
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
      const dest = path.join.apply(null, [nodeModules, ...pkg.name.split('/')]);

      const queue = new Queue(1);
      queue.defer((cb) => unlink(dest, (err) => cb(err)));

      if (typeof pkg.bin === 'string') {
        const binName = pkg.name as string;
        queue.defer((cb) => unlinkBin(nodeModules, binName, (err) => cb(err)));
      } else {
        for (const binName in pkg.bin) {
          const bn = binName;
          queue.defer((cb) => unlinkBin(nodeModules, bn, (err) => cb(err)));
        }
      }

      queue.await((err) => {
        err ? callback(err) : callback(undefined, dest);
      });
    } catch (err) {
      return callback(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

export default function unlinkModule(src: string, nodeModules: string, callback?: UnlinkCallback): void | Promise<string> {
  if (typeof callback === 'function') return worker(src, nodeModules, callback);
  return new Promise((resolve, reject) => worker(src, nodeModules, (err, restore?) => (err ? reject(err) : resolve(restore!))));
}
