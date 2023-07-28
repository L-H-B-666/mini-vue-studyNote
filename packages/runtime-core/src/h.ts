import { createVNode } from "./vnode";
/**h函数，实际上就是直接调用 createVNode 函数
 * @param type 
 * @param props 
 * @param children 
 * @returns 
 */
export const h = (type: any, props: any = null, children: string | Array<any> = []) => {
  return createVNode(type, props, children);
};
