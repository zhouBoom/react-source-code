import {REACT_ELEMENT_TYPE, REACT_FORWARD_REF_TYPE, REACT_TEXT_TYPE, CREATE, MOVE, DELETE} from './utils';
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
        dom = document.createTextNode(props.text); // 创建文本节点
    } else if (type && VNode.$$typeof === REACT_ELEMENT_TYPE) {
        dom = document.createElement(type); // 创建元素节点
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
    children.forEach((child, i) => { // 递归挂载
        children[i].index = i; // domDiff算法
        mount(child, parent);
    })
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
export function updateDomTree(oldVNode, newVNode, oldDom) {
    console.log('DomDiff start');
    if (!oldDom || !newVNode) return;
    /**
     * 这块比较耗费性能，所以在这块做dom diff
     */
    // 更新属性
    // let parentNode = oldDom.parentNode;
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
    console.log('UPDATE_TYPE', UPDATE_TYPE);
    switch(UPDATE_TYPE) {
        case 'NO_OPREAT':
            break;
        case 'ADD':
            oldDom.parentNode.appendChild(createDom(newVNode));
            break;
        case 'DELETE':
            removeVNode(oldVNode);
            break;
        case 'REPLACE':
            removeVNode(oldVNode);
            oldDom.parentNode.appendChild(createDom(newVNode));
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
/**
 * 深入比较新旧节点
 * @param {*} oldVNode 
 * @param {*} newVNode 
 */
function deepDOMDiff(oldVNode, newVNode) {
    // 函数组件、类组件、原生节点
    let diffTypeMap = {
        ORIGINAL: typeof oldVNode.type === 'string',
        FUNCTION: typeof oldVNode.type === 'function',
        CLASS: typeof oldVNode.type === 'function' && oldVNode.type.IS_CLASS_COMPONENT,
        TEXT: oldVNode.type === REACT_TEXT_TYPE
    }
    const DIFF_TYPE = Object.keys(diffTypeMap).filter(key => diffTypeMap[key])[0];
    console.log('DIFF_TYPE', DIFF_TYPE);
    switch(DIFF_TYPE){
        case 'ORIGINAL':
            // 原生节点
            let currentDOM = newVNode.dom = findDOMByVNode(oldVNode);
            setPropsFromDom(currentDOM, newVNode.props);
            updateChildren(currentDOM, oldVNode.props.children, newVNode.props.children);
            break;
        case 'FUNCTION':
            updateFunctionComponent(oldVNode, newVNode);
            break;
        case 'CLASS':
            updateClassComponent(oldVNode, newVNode);
            break;
        case 'TEXT':
            newVNode.dom = findDOMByVNode(oldVNode);
            newVNode.dom.textContent = newVNode.props.text;
            break;
        default:
            break;
    }
}

/**
 * 更新子节点
 * @param {*} currentDOM 旧的真实dom
 * @param {*} oldChildren 旧的虚拟dom
 * @param {*} newChildren 新的虚拟dom
 */
function updateChildren(parentDom, oldChildren, newChildren) {
    // 更新子节点 不动、移动、删除、新建
    oldChildren = Array.isArray(oldChildren) ? oldChildren : [oldChildren].filter(Boolean); // 过滤掉空节点
    newChildren = Array.isArray(newChildren) ? newChildren : [newChildren].filter(Boolean); // 过滤掉空节点
    let lastNotChangeIndex = -1; // 记录最后一个不需要移动的节点
    let oldKeyChildrenMay = {}; // 旧的虚拟dom的key和虚拟dom的映射
    // 遍历旧的虚拟dom，生成key和虚拟dom的映射
    oldChildren.forEach((oldVNode, index) => {
        const oldKey = oldVNode && oldVNode.key ? oldVNode.key : index; // 如果虚拟dom有key，则使用key，否则使用index，所以建议编写代码用key
        oldKeyChildrenMay[oldKey] = oldVNode;
    })
    // 遍历新的虚拟dom，找出需要移动的节点、重新创建的节点、删除的节点、剩下的就是可以复用的节点
    let actions = [];
    newChildren.forEach((newVNode, index) => {
       newVNode.index = index; // TODO: 给新的虚拟dom添加index属性,为什么呢
       let newKey = newVNode && newVNode.key ? newVNode.key : index; // 如果虚拟dom有key，则使用key，否则使用index，所以建议编写代码用key
       // 根据key去旧节点map重，如果有则复用
       let oldVNode = oldKeyChildrenMay[newKey];
       if (oldVNode) { // 如果旧节点map中有这个key，则说明可以复用，进行深度比较
        deepDOMDiff(oldVNode, newVNode);
         if(oldVNode.index < lastNotChangeIndex){ // key相同，但是位置不同，需要移动，记录移动操作
            actions.push({
                type: MOVE,
                oldVNode,
                newVNode,
                toIndex: lastNotChangeIndex + 1
            })

         }
         delete oldKeyChildrenMay[newKey]; // 复用的就删除掉了，剩下的就是需要删除的节点
         lastNotChangeIndex = Math.max(lastNotChangeIndex, oldVNode.index); // 更新lastNotChangeIndex
       } else { // 记录到actions重
         actions.push({
            type: CREATE,
            newVNode,
            index
         })
       }
    })
    // 移动的节点
    let VNodeToMOVE = actions.filter(action => action.type === MOVE).map(action => action.oldVNode);
    // 删除的节点
    let VNodeToDELETE = Object.values(oldKeyChildrenMay);
    VNodeToMOVE.concat(VNodeToDELETE).forEach(oldVNode => {
        let currentDOM = findDOMByVNode(oldVNode);
        currentDOM.remove();
    })
    // 操作actions
    actions.forEach(action => {
        const {type, oldVNode, newVNode, toIndex} = action;
        const childNodes = parentDom.childNodes; // 剩余的节点
        const childNode = childNodes[toIndex]; // 如果能拿到childNode，则移动，否则创建
        // 获取需要插入的dom
        const getDomForInsert = () => {
            if (type === MOVE) {
                return findDOMByVNode(oldVNode);
            } else if (type === CREATE) {
                return createDom(newVNode);
            }
        }
        if (childNode) { // 如果当前index有节点，则往前插入
            parentDom.insertBefore(getDomForInsert(), childNode);
        } else { // 如果当前index没有节点，则往后追加
            parentDom.appendChild(getDomForInsert());
        }
    })
}

function updateClassComponent(oldVNode, newVNode) {
    // 更新类组件
    const classInstance = newVNode.classInstance = oldVNode.classInstance;
    classInstance.updater.launchUpdate();
}

function updateFunctionComponent(oldVNode, newVNode) {
    // 更新函数组件
    let oldDom = findDOMByVNode(oldVNode);
    if (!oldDom) return;
    const {type, props} = newVNode;
    let newRenderVNode = type(props); // 函数执行完返回的虚拟dom
    updateDomTree(oldVNode.oldRenderVNode, newRenderVNode, oldDom);
    newVNode.oldRenderVNode = newRenderVNode; // 更新虚拟dom
}

const ReactDOM = {
    render
}

export default ReactDOM;