import React from 'react'
import { Table, Select, Input, Icon, Button, Popconfirm } from 'antd'
import axios from '../net'
import './table.css'
class ModuleTable extends React.Component {
    constructor() {
        super()
        this.state = {
            list: []
        }
    }

    // componentDidUpdate() {
    //     if (this.props.list.length) {
    //         this.setState((prev, props) => ({
    //             list: prev.list.splice(1, 1, props)
    //         }))
    //     }
    //     console.log(this.props.list.length);
    //     console.log('updated');
    // }
    componentWillReceiveProps(props) {
        this.setState({ list: props.list })
    }
    componentDidMount() {
        !this.props.editable && this.columns.pop()
    }
    columns = [{
        title: '中文名',
        dataIndex: 'name',
        key: 'name',
        width: 300
        // render: text => <a href="javascript:;">{text}</a>,
    },
    {
        title: '历史翻译',
        dataIndex: 'history',
        key: 'history',
        width: 300,
        render: (item, src, idx) => {
            return <Select placeholder="Please Select" defaultValue={src.eName} style={{ width: '100%' }} onSelect={(val, a) => {
                // src.eName = val;
                // console.log(src.eName);
                this.change(val, src, idx)
            }}>
                {item.map(unit => <Select.Option key={unit} value={unit}>{unit}</Select.Option>)}
            </Select>
        }
    }, {
        title: '英文名',
        dataIndex: 'eName',
        key: 'eName',
        width: 300,
        render: (value, src, idx) => {
            return <Input
                value={value}
                onChange={(e) => this.handleChange(e, src, idx)}
                // onPressEnter={this.check}
                suffix={(
                    <Icon
                        type="check"
                    // className="editable-cell-icon-check"
                    // onClick={this.check}
                    />
                )}
            />
        }

    }, {
        title: '位置',
        dataIndex: 'module',
        key: 'module',
        width: 100

    }, {
        title: '生效状态',
        dataIndex: 'state',
        key: 'state',
        width: 100,
        render: val => {
            return val ? '已生效' : '未生效'
        }
    }];
    handleChange(e, src) {
        src.modify = true
        src.eName = e.target.value;
        this.setState({
            list: this.state.list
        })
    }
    change(val, src, idx) {
        if (val !== src.eName) {
            src.modify = true

            src.eName = val
            this.setState({
                list: this.state.list
            })
        }

        // this.props.list.find(unit => unit._id === src._id).eName = val
        // this.props.list.unshift({ name: 1 })
    }
    async save() {
        await axios.post('/save', { list: this.state.list.filter(item => item.modify).map(item => ({ _id: item._id, eName: item.eName })) })
        this.props.fresh()

    }
    async enable() {
        await axios.post('/enable', { list: this.state.list.filter(item => !item.state).map(item => item._id) })
        this.props.fresh()
    }
    render() {
        return <div>
            {this.state.list.map(dom=>
                <div>
                    <h3 >{dom._id}</h3>
                    <Table rowKey="_id" dataSource={dom.components} columns={this.columns} onChange={src => this.props.getMore(src)} pagination={{ position: 'top', total: this.props.count }}></Table>
                </div>     
            )}
            
            <Popconfirm title="确认取消？" onConfirm={() => this.props.fresh()}>
                <Button className="marL15">取消</Button>
            </Popconfirm>
            <Popconfirm title="确认保存？" onConfirm={() => this.save()}>
                <Button className="marL15">保存</Button>
            </Popconfirm>
            {this.props.user&&this.props.user.isAdmin ? <Popconfirm title="确认生效？" onConfirm={() => this.enable()}>
                <Button className="marL15">生效</Button>
            </Popconfirm> : null}

        </div>
    }
}
export default ModuleTable