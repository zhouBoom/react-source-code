import {REACT_ELEMENT_TYPE, REACT_FORWARD_REF_TYPE, REACT_TEXT_TYPE} from './utils';
import { addEvent } from './event';
/**
 * 将React元素渲染到DOM中
 * @param {*} VNode 虚拟dom JSX转化为虚拟dom，由babel完成
 * @param {*} container 容器 真实dom
 */
function render(VNode, container) { // 第一次创建挂载
    console.log(VNode, container);
    mount(VNode, container);
}
// 挂载
function mount(VNode, container) {
    // 1. 虚拟dom转换为真实dom
    const dom = createDom(VNode);
    // 2. 将真实dom挂载到容器中
    dom && container.appendChild(dom);
}

// 将虚拟dom转换为真实dom
function createDom(VNode) {
    const {type, props, ref} = VNode;
    // 1. 处理函数组件
    if (type && type.$$typeof === REACT_FORWARD_REF_TYPE) {
        return getDomByForwardRef(VNode);
    }
    // 类组件
    if (typeof type === 'function' && VNode.$$typeof === REACT_ELEMENT_TYPE && type.IS_CLASS_COMPONENT) {
        return getDomByClassComponent(VNode);
    }
    // 函数组件
    if (typeof type === 'function' && VNode.$$typeof === REACT_ELEMENT_TYPE) {
        return getDomByFunctionComponent(VNode);
    }
    let dom;
    // 文本
    console.log('VNode', VNode);
    if (type && VNode.type === REACT_TEXT_TYPE) {
        console.log('文字')
        dom = document.createTextNode(props.text);
    } else if (type && VNode.$$typeof === REACT_ELEMENT_TYPE) {
        dom = document.createElement(type);
    }
    // 2. 根据props的children处理子元素, children可能为单个元素，也可能为多个元素
    if (props) {
        if (Array.isArray(props.children)) {
            // props.children.forEach(child => {
            //     if (typeof child === 'string') {
            //         dom.appendChild(document.createTextNode(child));
            //     } else {
            //         mount(child, dom);
            //     }
            // })
            mountArray(props.children, dom);
        } else if (typeof props.children === 'object' && props.children.type) { // 单个元素
            mount(props.children, dom); // 递归挂载
        }
    }
    // 3. 处理属性
    setPropsFromDom(dom, props);
    // 4. 处理ref
    if (ref) { // 原始标签
        ref.current = dom;
    }
    VNode.dom = dom; // 将真实dom保存到虚拟dom上
    // 4. 返回真实dom
    return dom;
}

/**
 * 获取转发ref的真实dom
 * @param {*} VNode 
 */
function getDomByForwardRef(VNode) {
    const {type, props, ref} = VNode;
    let renderVNode = type.render(props, ref);
    if (!renderVNode) return;
    return createDom(renderVNode);
}

/**
 * 获取函数组件的真实dom
 * @param {*} VNode 
 * 返回一个虚拟dom
 */
function getDomByFunctionComponent(VNode){
    const {type, props} = VNode;
    // type是一个函数，props是参数
    let renderVNode = type(props);
    if (!renderVNode) return;
    // 递归挂载
    return createDom(renderVNode);
}

/**
 * 获取类组件的真实dom
 * @param {*} VNode 
 */
function getDomByClassComponent(VNode) {
    const {type, props, ref} = VNode;
    // 创建组件实例
    const instance = new type(props);
    // 调用render方法获取虚拟dom
    const renderVNode = instance.render();
    instance.oldVNode = renderVNode; // 让类组件拥有一个oldVNode属性保存组件实例的虚拟dom
    if (ref) { // 类组件
        ref.current = instance;
    }
    if (!renderVNode) return;
    // setTimeout(() => {
    //     instance.setState({
    //         xxx: 1000
    //     });
    //     instance.setState({
    //         xxx: 1001
    //     });
    // }, 3000)

    return createDom(renderVNode);
}

// 挂载多个子元素
function mountArray(children, parent) {
    if (!Array.isArray(children)) return;
    if (Array.isArray(children)) {
        children.forEach((child, i) => { // 递归挂载
            children[i].index = i; // domDiff算法
            mount(child, parent);
        })
    }
}

// 将虚拟dom的props设置到真实dom上
function setPropsFromDom(dom, VNodeProps = {}) {
    console.log('VNodeProps',VNodeProps);
    if (!dom) return;
    for (let key in VNodeProps) {
        if (key === 'children') {
            continue;
        }
        if (/^on[A-Z]/.test(key)) {
            // 事件处理 类似于click之类的
            addEvent(dom, key.toLowerCase(), VNodeProps[key]);
        } else if (key === 'style') {
            // 样式处理
            Object.keys(VNodeProps.style).forEach((styleName) => {
                dom.style[styleName] = VNodeProps[key][styleName];
            })
        } else {
            // 其他属性
            dom[key] = VNodeProps[key];
        }
    }
}

export function findDOMByVNode(VNode) {
    if (!VNode) return;
    if (VNode.dom) return VNode.dom;
}
/**
 * 更新真实dom
 * @param {*} oldDom 
 * @param {*} newVNode 
 */
export function updateDomTree(oldDom, newVNode) {
    if (!oldDom || !newVNode) return;
    /**
     * 这块比较耗费性能，所以在这块做dom diff
     */
    // 更新属性
    let parentNode = oldDom.parentNode;
    // 比较新旧节点
    // 1. 新旧节点都不存在
    // 2. 新节点存在，旧节点不存在
    // 3. 新节点不存在，旧节点存在
    // 4. 新旧节点都存在, 类型不一样
    // 5. 新旧节点都存在, 类型一样，进行深入比较
    const typeMap = {
        NO_OPREAT: !oldVNode && !newVNode,
        ADD: newVNode && !oldVNode,
        DELETE: oldVNode && !newVNode,
        REPLACE: oldVNode && newVNode && oldVNode.type !== newVNode.type
    }
    const UPDATE_TYPE = Object.keys(typeMap).filter(key => typeMap[key])[0]; // 获取第一个为true的类型
    switch(UPDATE_TYPE) {
        case 'NO_OPREAT':
            break;
        case 'ADD':
            addVNode(newVNode, parentNode);
            break;
        case 'DELETE':
            removeVNode(oldVNode);
            break;
        case 'REPLACE':
            removeVNode(oldVNode);
            addVNode(newVNode, parentNode);
            break;
        default:
            deepDOMDiff(oldVNode, newVNode);
    }
   
    // 移除旧的元素
    // parentNode.removeChild(oldDom);
    // 添加新的根据虚拟dom获取的真实dom
    // parentNode.appendChild(createDom(newVNode));
}

function removeVNode(oldVNode) {
   const currentDOM = findDOMByVNode(oldVNode);
   currentDOM.remove();
}
function addVNode(newVNode, parentNode) {
    parentNode.appendChild(createDom(newVNode));
}
/**
 * 深入比较新旧节点
 * @param {*} oldVNode 
 * @param {*} newVNode 
 */
function deepDOMDiff(oldVNode, newVNode) {
}

const ReactDOM = {
    render
}

export default ReactDOM;