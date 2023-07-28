import { createVNode } from "./vnode";

export function createAppAPI(render) {
  /**创建APP，参数是根组件。注意是组件 */
  return function createApp(rootComponent) {
    const app = {
      _component: rootComponent,
      /** 挂载方法
       * @param rootContainer 根容器的HTML元素
       */
      mount(rootContainer: Element) {
        console.log("基于根组件创建 vnode");
        /**基于根组件创建 vnode。注意这里用到了闭包 */
        const vnode = createVNode(rootComponent);
        console.log("调用 render，基于 vnode 进行开箱");
        /**然后调用 render，基于 vnode 进行开箱 */
        render(vnode, rootContainer); //这里的render来源于 packages\runtime-core\src\renderer.ts 的21行
      },
    };

    return app;
  };
}
