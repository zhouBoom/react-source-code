// import ReactDOM from 'react-dom';
import React from './react';
import ReactDOM from './react-dom';
// 函数组件
// function MyFunctionComponent(props) {
//     return <div style={{color: 'red', fontSize: '20px'}}>react源码<span>开发<h1>标题1</h1></span></div>
// }
// 类组件
class MyClassComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            xxx: 'state',
            num: 999,
            count: 0
        }
    }
    updateShowText() {
        this.setState({
            count: this.state.count + 1
        });
    }
    render() {
        return <div style={{
                color: 'red', 
                fontSize: '20px'
                }}
                onClick={() => this.updateShowText()}
                >
                simple react count {this.state.count}
            </div>
    }
}

class MyChildComponent extends React.Component {
    constructor(props) {
        super(props);
        this.childRef = React.createRef();
        this.inputRef = React.createRef();
        this.forwardRef = React.createRef();
    }
    updateChildText() {
        console.log('组件current', this.childRef.current);
        this.childRef.current.updateShowText();
    }
    focusInput() {
        console.log('element的current', this.inputRef.current);
        console.log('forwardRef的current', this.forwardRef.current);
        this.forwardRef.current.value = '操作forwardRef里的value';
        this.inputRef.current.focus();
    }
    render() {
        return (
        <div>
            <div onClick={() => this.updateChildText()}>点击调用ref</div>
            <MyClassComponent ref={this.childRef} xx="使用了props"/>
            <MyForwardRefComponent ref={this.forwardRef}/>
            <input ref={this.inputRef}/>
            <button onClick={() => this.focusInput()}>聚焦</button>
        </div>
        )
    }
}

const MyForwardRefComponent = React.forwardRef((props, ref) => {
    return <div>转发ref<input ref={ref}></input></div>
});
ReactDOM.render(<MyChildComponent/>, document.getElementById('root'));
// console.log(<div >Hello World<span>xx1</span><span>xx2</span></div>);