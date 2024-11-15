import { findDOMByVNode, updateDomTree } from "./react-dom";
// 更新队列
export let updateQueue = {
    isBatch: false,
    updaters: new Set()
}
export function flushUpdateQueue() {
    updateQueue.isBatch = false;
    for(const updater of updateQueue.updaters) {
        updater.launchUpdate();
    }
    // 清空队列
    updateQueue.updaters.clear();
}
class Updater {
    constructor(ClassComponentInstance) {
        // 类组件实例
        this.ClassComponentInstance = ClassComponentInstance;
        // 执行多次的时候，是存储打算更新多次的状态队列
        this.pendingStates = [];
    }
    // 添加状态
    addState(partialState) {
        this.pendingStates.push(partialState);
        this.perHanderForUpdate();
    }
    /**
     * 处理更新
     */
    perHanderForUpdate() {
        if (updateQueue.isBatch) {
            // 批量更新
            updateQueue.updaters.add(this);
        } else {
            // 非批量更新,马上更新
            this.launchUpdate();
        }
    }
    launchUpdate() {
        // pendingStates统一处理
        const { ClassComponentInstance, pendingStates } = this;
        if (pendingStates.length === 0) {
            return;
        } else {
            ClassComponentInstance.state = pendingStates.reduce((perStates, newStates) => {
                return {...perStates, ...newStates}
            }, ClassComponentInstance.state)
            this.pendingStates.length = 0
            // 调用类组件的实例的更新方法
            ClassComponentInstance.update()
        }
    }
}
/**
 * 导出一个class基类
 */
export class Component {
    static IS_CLASS_COMPONENT = true;
    constructor(props) {
        // 更新器
        this.updater = new Updater(this);
        // 初始化props
        this.props = props;
        // 初始化状态
        this.state = {};
    }
    setState(partialState) {
        // 1. 合并属性,只需要执行同次里面最后一次合并，进行批量更新
        this.updater.addState(partialState);
        // this.state = {...this.state, ...partialState};
        // 2. 更新状态
        // 3. 更新真实dom
        // this.update()
    }
    update() {
        // 1. 获取重新执行render后的虚拟dom
        // 2. 根据虚拟dom创建真实dom
        // 3. 将真实dom挂在到容器中
        const oldVNode = this.oldVNode; // TODO: 让类组件拥有一个oldVNode属性保存组件实例的虚拟dom
        console.log('updateComponent oldVNode', oldVNode);
        const oldDom = findDOMByVNode(oldVNode); // TODO: 将真实DOM保存到相应的虚拟DOM上
        const newVNode = this.render();
        updateDomTree(oldVNode, newVNode, oldDom);
        this.oldVNode = newVNode;
    }
}