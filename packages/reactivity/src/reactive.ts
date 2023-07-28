import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";
/**未知的枚举 */
export const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  RAW = "__v_raw",
}
/**未知键值 */
export interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.RAW]?: any
}
/**全局变量，当前存在的reactive变量的weakMap */
export const reactiveMap = new WeakMap<Target, any>();
/**全局变量，只读的reactive变量的weakMap */
export const readonlyMap = new WeakMap<Target, any>();
/**全局变量，非递归监听的reactive变量的weakMap */
export const shallowReadonlyMap = new WeakMap<Target, any>();


/**创建reactive响应式数据函数 */
export function reactive(target) {
  return createReactiveObject(target, reactiveMap, mutableHandlers);
}
/**创建只读的reactive响应式数据函数 */
export function readonly(target) {
  return createReactiveObject(target, readonlyMap, readonlyHandlers);
}

/**创建非递归监听的reactive响应式数据函数 */
export function shallowReadonly(target) {
  return createReactiveObject(
    target,
    shallowReadonlyMap,
    shallowReadonlyHandlers
  );
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isReactive(value) {
  // 如果 value 是 proxy 的话
  // 会触发 get 操作，而在 createGetter 里面会判断
  // 如果 value 是普通对象的话
  // 那么会返回 undefined ，那么就需要转换成布尔值
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function toRaw(value) {
  // 如果 value 是 proxy 的话 ,那么直接返回就可以了
  // 因为会触发 createGetter 内的逻辑
  // 如果 value 是普通对象的话，
  // 我们就应该返回普通对象
  // 只要不是 proxy ，只要是得到了 undefined 的话，那么就一定是普通对象
  // TODO 这里和源码里面实现的不一样，不确定后面会不会有问题
  if (!value[ReactiveFlags.RAW]) {
    return value;
  }

  return value[ReactiveFlags.RAW];
}
/**给target对象创建Proxy
 * @param target 对象
 * @param proxyMap 全局变量，存放响应式的一个weakMap集合，在本函数中 1.用于判断当前对象是否已经存在 2.不存在的话就新建然后放入这个全局变量中
 * @param baseHandlers Proxy处理器，即get和set 等
 * @returns 
 */
function createReactiveObject(target, proxyMap, baseHandlers) {
  // 核心就是 proxy
  // 目的是可以侦听到用户 get 或者 set 的动作

  // 如果命中的话就直接返回就好了
  // 使用缓存做的优化点
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, baseHandlers);

  // 把创建好的 proxy 给存起来，
  proxyMap.set(target, proxy);
  return proxy;
}
