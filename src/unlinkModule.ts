import fs from 'fs';
import path from 'path';
import { unlink } from 'link-unlink';
import Queue from 'queue-cb';

function unlinkBin(nodeModules, binName, callback) {
  const destBin = path.join(nodeModules, '.bin', binName);

  fs.stat(destBin, (err) => {
    if (!err) return unlink(destBin, callback);
    console.log(`bin not found: ${destBin}. Skipping`);
    callback();
  });
}

function worker(src, nodeModules, callback) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
    const dest = path.join.apply(null, [nodeModules, ...pkg.name.split('/')]);

    const queue = new Queue(1);
    queue.defer(unlink.bind(null, dest));

    if (typeof pkg.bin === 'string')
      queue.defer(unlinkBin.bind(null, nodeModules, pkg.name)); // single bins
    else for (const binName in pkg.bin) queue.defer(unlinkBin.bind(null, nodeModules, binName)); // object of bins

    queue.await((err) => {
      err ? callback(err) : callback(null, dest);
    });
  } catch (err) {
    return callback(err);
  }
}

import type { UnlinkCallback } from './types';

export default function unlinkModule(src: string, nodeModules: string, callback?: undefined | UnlinkCallback): undefined | Promise<string> {
  if (typeof callback === 'function') return worker(src, nodeModules, callback) as undefined;
  return new Promise((resolve, reject) => worker(src, nodeModules, (err, restore?) => (err ? reject(err) : resolve(restore))));
}
