export type * from './types';
export { default as linkModule } from './linkModule';
export { default as unlinkModule } from './unlinkModule';

import { default as linkModule } from './linkModule';
import { default as unlinkModule } from './unlinkModule';
export default { linkModule, unlinkModule };
