import { updateQueue, flushUpdateQueue } from "./component";
export function addEvent(dom, eventName, bindFunction) {
    if (!dom) return;
    dom.accach = dom.accach || {};
    dom.accach[eventName] = bindFunction;
    // 事件合成机制核心点一：绑定事件到document上
    if (document[eventName]) { // 如果事件已经绑定过了，则直接返回
        return;
    }
    document[eventName] = dispatchEvent;
}

/**
 * 事件调度,冒泡到document上的
 * @param {*} event 真实事件源
 */
function dispatchEvent(nativeEvent) {
    updateQueue.isBatch = true; // 开启批量更新
    // 事件合成机制核心点二：屏蔽浏览器差异
    const syntheticEvent = createSyntheticEvent(nativeEvent);
    // 事件源
    let target = nativeEvent.target;
    while(target) {
        syntheticEvent.currentTarget = target; // 最终要把事件传入到最终的事件回调
        let eventName = `on${nativeEvent.type}`;
        let bindFunction = target.accach && target.accach[eventName]; // 拿到绑定函数
        bindFunction && bindFunction(syntheticEvent); // 调用绑定函数
        if (syntheticEvent.isPropagationStopped) {
            break; // 如果阻止了事件冒泡，则退出循环
        }
        target = target.parentNode; // 如果有父节点就一直往外找
    }
    // 事件冒泡路径
    flushUpdateQueue(); // 刷新队列,update在最后执行，这就是事件合成机制
}

/**
 * 
 * @param {*} nativeEvent 
 * @returns 原始的事件对象
 */
function createSyntheticEvent(nativeEvent) {
    let netiveEventKeyValues = {};
    for (let key in nativeEvent) { // 复制一份原始事件对象,比Object.keys的好处是，可以复制非枚举属性
        netiveEventKeyValues[key] = typeof nativeEvent[key] === 'function' ? nativeEvent[key].bind(nativeEvent) : nativeEvent[key];
    }
    // 组织事件冒泡，阻止默认行为
    let syntheticEvent = Object.assign(
        netiveEventKeyValues, 
        { 
            nativeEvent, 
            isDefaultPrevented: false, 
            isPropagationStopped: false, 
            // 阻止默认行为
            preventDefault: function() {
                this.isDefaultPrevented = true;
                if (this.nativeEvent.preventDefault) { // 如果原生事件有preventDefault方法，则调用
                    this.nativeEvent.preventDefault();
                } else {
                    this.nativeEvent.returnValue = false;
                }
            },
            // 阻止事件冒泡
            stopPropagation: function() {
                this.isPropagationStopped = true;
                if (this.nativeEvent.stopPropagation) { // 如果原生事件有stopPropagation方法，则调用
                    this.nativeEvent.stopPropagation();
                } else {
                    this.nativeEvent.cancelBubble = true;
                }
            }
            
     });
    return syntheticEvent;
}