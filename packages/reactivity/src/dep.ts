import { ReactiveEffect } from "./effect";

/**用于存储所有的 effect 对象，会把effects数组生成一个Set集合 */
export function createDep(effects?: ReactiveEffect[]) {
  const dep = new Set(effects);
  return dep;
}
