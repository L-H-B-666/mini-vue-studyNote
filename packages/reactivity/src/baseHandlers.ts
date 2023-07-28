// new Proxy 的 处理器
import { track, trigger } from "./effect";
import {
  reactive,
  ReactiveFlags,
  reactiveMap,
  readonly,
  readonlyMap,
  shallowReadonlyMap,
  Target,
} from "./reactive";
import { isObject } from "@mini-vue/shared";
/**get函数 */
const get = createGetter();
/**set函数 */
const set = createSetter();
/**只读的get */
const readonlyGet = createGetter(true);
/**非递归监听的get */
const shallowReadonlyGet = createGetter(true, true);

/**创建一个getter 
 * @param isReadonly 是否为只读
 * @param shallow 是否是非递归监听（即不监听内部属性）
 * @returns getter函数
 */
function createGetter(isReadonly = false, shallow = false) {
  /** 返回一个getter函数
    * @param target 需要取值的目标对象
    * @param key 需要获取的值的键值
    * @param receiver 如果target对象中指定了getter，receiver则为getter调用时的this值 
    * @returns target.key 的值
   */
  return function get(target: Target, key: string | symbol, receiver: object) {

    //#region TODO: 暂时跳过
    const isExistInReactiveMap = () =>
      key === ReactiveFlags.RAW && receiver === reactiveMap.get(target);

    const isExistInReadonlyMap = () =>
      key === ReactiveFlags.RAW && receiver === readonlyMap.get(target);

    const isExistInShallowReadonlyMap = () =>
      key === ReactiveFlags.RAW && receiver === shallowReadonlyMap.get(target);

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (
      isExistInReactiveMap() ||
      isExistInReadonlyMap() ||
      isExistInShallowReadonlyMap()
    ) {
      return target;
    }
    //#endregion

    /**要返回出去的数据，即target.key，通过反射 */
    const res = Reflect.get(target, key, receiver);

    // 问题：为什么是 readonly 的时候不做依赖收集呢
    // readonly 的话，是不可以被 set 的， 那不可以被 set 就意味着不会触发 trigger
    // 所有就没有收集依赖的必要了 

    if (!isReadonly) {//不是只读属性的话就收集
      // 在触发 get 的时候进行依赖收集
      track(target, "get", key);
    }

    if (shallow) {
      return res;//非递归监听，就是不递归子属性（下面就在递归）
    }

    if (isObject(res)) { //递归调用，把全部对象都变成reactive
      // 把内部所有的是 object 的值都用 reactive 包裹，变成响应式对象
      // 如果说这个 res 值是一个对象的话，那么我们需要把获取到的 res 也转换成 reactive
      // res 等于 target[key]
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}
/**创建一个setter */
function createSetter() {
  /** setter函数
    * @param target 需要修改的目标对象
    * @param key 需要修改的值的键值
    * @param value 修改后的值
    * @param receiver 如果遇到 setter，receiver则为setter调用时的this值。
    * @returns 返回一个 Boolean 值表明是否成功设置属性。
   */
  return function set(target: object, key: string | symbol, value: unknown, receiver: object) {
    /**通过反射进行设置键值，拿到返回结果：返回一个 Boolean 值表明是否成功设置属性。 */
    const result = Reflect.set(target, key, value, receiver);

    // 在触发 set 的时候进行触发依赖
    trigger(target, "set", key);

    return result;
  };
}
/**只读的Proxy处理器 */
export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    // readonly 的响应式对象不可以修改值
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
};
/**普通的Proxy处理器，只有Getter和Setter */
export const mutableHandlers = {
  get,
  set,
};
/**非递归监听（即不监听内部属性）的处理器 */
export const shallowReadonlyHandlers = {
  get: shallowReadonlyGet,
  set(target, key) {
    // readonly 的响应式对象不可以修改值
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
};
