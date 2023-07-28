// 源码里面这些接口是由 runtime-dom 来实现
// 这里先简单实现

import { isOn } from "@mini-vue/shared";
import { createRenderer } from "@mini-vue/runtime-core";

// 后面也修改成和源码一样的实现
function createElement(type) {
  console.log("CreateElement", type);
  const element = document.createElement(type);
  return element;
}

function createText(text) {
  return document.createTextNode(text);
}

function setText(node, text) {
  node.nodeValue = text;
}
/**设置text类型的元素 
 * @param el DOM元素
 * @param text 文本
 */
function setElementText(el, text) {
  console.log("SetElementText", el, text);
  el.textContent = text;
}
/**更新props 
 * @param el DOM元素
 * @param key 要改变props的键
 * @param preValue 旧值
 * @param nextValue 新值
 */
function patchProp(el, key, preValue, nextValue) {
  // preValue 之前的值
  // 为了之后 update 做准备的值
  // nextValue 当前的值
  console.log(`PatchProp 设置属性:${key} 值:${nextValue}`);
  console.log(`key: ${key} 之前的值是:${preValue}`);

  if (isOn(key)) {//如果是on开头的，说明这个props是事件
    /* 
      添加事件处理函数的时候需要注意一下
     1. 添加的和删除的必须是一个函数，不然的话 删除不掉
        那么就需要把之前 add 的函数给存起来，后面删除的时候需要用到
     2. nextValue 有可能是匿名函数，当对比发现不一样的时候也可以通过缓存的机制来避免注册多次
    */
    /**存储所有的事件函数 */
    const invokers = el._vei || (el._vei = {});
    /**当前key在缓存中对应的事件 */
    const existingInvoker = invokers[key];
    if (nextValue && existingInvoker) {//有的话
      // patch
      // 直接修改函数的值即可
      existingInvoker.value = nextValue;
    } else {//没有的话
      /**事件名，用的addEventListener，所以去掉on，转小写，比如onClick --> click */
      const eventName = key.slice(2).toLowerCase();
      if (nextValue) {//新值不为空的话，说明是props改变了
        /**拿到这个要绑定的函数函数，顺便设置缓存 */
        const invoker = (invokers[key] = nextValue);
        /**添加事件监听器 */
        el.addEventListener(eventName, invoker);
      } else {//新值为空的话，说明是这个props被删掉了
        el.removeEventListener(eventName, existingInvoker);//移除监听
        invokers[key] = undefined;//删除该值
      }
    }
  } else {//如果不是on开头的，说明不是事件，直接当做普通的属性
    if (nextValue === null || nextValue === "") {
      el.removeAttribute(key);//为空移除
    } else {
      el.setAttribute(key, nextValue);//不为空就设置
    }
  }
}
/**插入函数 
 * @param child 要被插入的子节点
 * @param parent 父节点
 * @param anchor 插入的锚点， child 将要插在这个节点之前
 */
function insert(child, parent, anchor = null) {
  console.log("Insert");
  parent.insertBefore(child, anchor);
}
/**在父母身上移除某个chlid 
 * @param child 要移除的child的指针
 */
function remove(child) {
  const parent = child.parentNode;//拿到父母的DMO
  if (parent) {
    parent.removeChild(child);
  }
}

let renderer;

function ensureRenderer() {
  // 如果 renderer 有值的话，那么以后都不会初始化了
  return (
    renderer ||
    (renderer = createRenderer({
      createElement,
      createText,
      setText,
      setElementText,
      patchProp,
      insert,
      remove,
    }))
  );
}

export const createApp = (...args) => {
  return ensureRenderer().createApp(...args);
};

export * from "@mini-vue/runtime-core"
