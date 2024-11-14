export const REACT_ELEMENT_TYPE = Symbol('react.element'); // 常量 虚拟dom
export const REACT_FORWARD_REF_TYPE = Symbol('react.forward_ref'); // 常量 转发ref
export const REACT_TEXT_TYPE = Symbol('react.text'); // 常量 文本
// 文本节点转换
export const toVNode = (node) => {
    return typeof node === 'string' || typeof node === 'number' ? {
        type: REACT_TEXT_TYPE,
        props: {
            text: node
        }
    } : node;
}