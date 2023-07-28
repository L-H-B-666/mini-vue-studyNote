import { initProps } from "./componentProps";
import { initSlots } from "./componentSlots";
import { emit } from "./componentEmits";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { proxyRefs, shallowReadonly } from "@mini-vue/reactivity";
/**创建组件实例 并且返回 */
export function createComponentInstance(vnode, parent) {
  /**组件实例 */
  const instance = {
    type: vnode.type,
    vnode,
    /**需要更新的 vnode，用于更新 component 类型的组件 */
    next: null,
    props: {},
    parent,
    /** 获取 parent 的 provides 作为当前组件的初始化值 这样就可以继承 parent.provides 的属性了 */
    provides: parent ? parent.provides : {},
    proxy: null,
    isMounted: false,
    /**存放 attrs 的数据 */
    attrs: {},
    /** 存放插槽的数据 */
    slots: {},
    /**context 对象 */
    ctx: {},
    /**存储 setup 的返回值 */
    setupState: {},
    emit: () => { },
  };

  // 在 prod 生产坏境下的 ctx 只是下面简单的结构
  // 在 dev 开发环境下会更复杂
  instance.ctx = {
    _: instance,
  };

  // 赋值 emit
  // 这里使用 bind 把 instance 进行绑定
  // 后面用户使用的时候只需要给 event 和参数即可
  instance.emit = emit.bind(null, instance) as any;

  return instance;
}
/**给实例加工 ，处理props和slots
 * @param instance 组件实例
 */
export function setupComponent(instance) {
  // 1. 处理 props
  // 取出存在 vnode 里面的 props 和 children
  const { props, children } = instance.vnode;
  initProps(instance, props);//初始化props。这里没有管attrs，暂时直接把 rawProps 赋值给了 instance，实际上会有更多操作，所以才会封装成函数
  // 2. 处理 slots
  initSlots(instance, children);//暂时不看

  /*
   源码里面有两种类型的 component
   一种是基于 options 创建的，还有一种是 function 的 
   这里处理的是 options 创建的，叫做 stateful 类型 
  */
  setupStatefulComponent(instance);
}
/**处理 stateful 类型的组件。在里面创建proxy和ctx，调用setup（没有setup的就调用vue2那部分的） */
function setupStatefulComponent(instance) {
  // todo
  // 1. 先创建代理 proxy，在这之后，我们在render函数中就能通过this使用setup函数返回出来的对象了
  console.log("创建 proxy");

  // proxy 对象其实是代理了 instance.ctx 对象， 我们在使用的时候需要使用 instance.proxy 对象，因为 instance.ctx 在 prod 和 dev 坏境下是不同的 
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  // 用户声明的对象就是 instance.type
  // const Component = {setup(),render()} ....
  const Component = instance.type;
  // 2. 调用 setup

  // 调用 setup 的时候传入 props 和 context 等
  const { setup } = Component;
  if (setup) {
    // 设置当前 currentInstance 的值
    // 必须要在调用 setup 之前
    setCurrentInstance(instance);
    /**获得 setup 的 Context */
    const setupContext = createSetupContext(instance);
    // 真实的处理场景里面应该是只在 dev 环境才会把 props 设置为只读的
    /**拿到setup函数的返回值（是一个对象） */
    const setupResult = setup && setup(shallowReadonly(instance.props), setupContext);

    setCurrentInstance(null);

    // 3. 处理 setupResult
    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}
/**获得 setup 的 Context */
function createSetupContext(instance) {
  console.log("初始化 setup context");
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose: () => { }, // TODO 实现 expose 函数逻辑
  };
}
/**处理 setupResult，setup返回值不同，得到的东西也不一样，如果是函数的话，就是渲染函数，如果是对象的话，里面的东西就拿出来 */
function handleSetupResult(instance, setupResult) {
  // setup 返回值不一样的话，会有不同的处理
  // 1. 看看 setupResult 是个什么
  if (typeof setupResult === "function") {
    // 如果返回的是 function 的话，那么绑定到 render 上
    // 认为是 render 逻辑
    // setup(){ return ()=>(h("div")) }
    instance.render = setupResult;
  } else if (typeof setupResult === "object") {
    // 返回的是一个对象的话
    // 先存到 setupState 上
    // 先使用 @vue/reactivity 里面的 proxyRefs
    // 后面我们自己构建
    // proxyRefs 的作用就是把 setupResult 对象做一层代理
    // 方便用户直接访问 ref 类型的值
    // 比如 setupResult 里面有个 count 是个 ref 类型的对象，用户使用的时候就可以直接使用 count 了，而不需要在 count.value
    // 这里也就是官网里面说到的自动解构 Ref 类型
    instance.setupState = proxyRefs(setupResult); //在这里，实现了在template中的ref不用.value
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  // 给 instance 设置 render

  // 先取到用户设置的 component options
  const Component = instance.type;

  if (!instance.render) {
    // 如果 compile 有值 并且当组件没有 render 函数，那么就需要把 template 编译成 render 函数
    if (compile && !Component.render) {
      if (Component.template) {
        // 这里就是 runtime 模块和 compile 模块结合点
        const template = Component.template;
        Component.render = compile(template);
      }
    }

    instance.render = Component.render;
  }

  // applyOptions()
}

function applyOptions() {
  // 兼容 vue2.x
  // todo
  // options api
}

let currentInstance = {};
// 这个接口暴露给用户，用户可以在 setup 中获取组件实例 instance
export function getCurrentInstance(): any {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}

let compile;
export function registerRuntimeCompiler(_compile) {
  compile = _compile;
}
