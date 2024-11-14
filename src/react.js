import { REACT_ELEMENT_TYPE, REACT_FORWARD_REF_TYPE, toVNode } from "./utils"
import { Component } from "./component";
/**
 * 创建一个React元素
 * @param {*} type 元素类型 例如div，span，h1, 函数组件，类组件, 原生组件, Fragment
 * @param {*} properties 元素属性
 * @param {*} children 元素子节点
 */
function createElement(type, properties, children) {
    // properties并不是包含所有的properties，例如ref，key等则不做处理
    let ref = properties.ref || null;
    let key = properties.key || null;
    ;['__self', '__source', 'ref', 'key'].forEach(key => {
        delete properties[key];
    });
    // 将properties中的children取出，并添加到props中,可能会有多个children
    let props = {...properties};
    if (arguments.length > 3) {
        // 在这处理多个子节点的情况
        props.children = [...arguments].slice(2).map(toVNode);
    } else {
        props.children = toVNode(children);
    }
    return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        ref, // 用于操作DOM元素
        key, // 用于DOM diff
        props
    }
}
/**
 * 创建一个ref
 * @returns 
 */
function createRef() {
    // 处理原始标签和类组件
    return {
        current: null
    }
}
/**
 * 转发ref
 * @param {*} ref 
 */
function forwardRef(render) {
    return {
        $$typeof: REACT_FORWARD_REF_TYPE,
        render
    }
}
// 创建一个React对象，将createElement方法挂载到React对象上
const React = {
    createElement,
    createRef,
    forwardRef,
    Component
}

export default React;