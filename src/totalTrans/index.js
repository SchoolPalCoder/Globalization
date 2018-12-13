import React from 'react'
import { Table, Select, Input, Icon, Modal, Button, Radio } from 'antd'
import axios from '../net'

class TotalTrans extends React.Component {
    constructor() {
        super()
        this.state = {
            list: [],
            totalCount: 0,
            search: null
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
        console.log(props);
        this.setState({ searchParam: this.props.searchParam })
        this.getList();
    }
    componentDidMount() {
        this.getList()
    }

    getList(page = 1) {
        let params = {
            key: this.state.searchParam && this.state.searchParam.key,
            state: 1,
            pageIdx: page,
            pageSize: 10
        }
        axios.post('/getTransTotalList', params).then(data => {
            this.setState({
                list: data.list,
                totalCount: data.totalCount
            })
        })
    }
    columns = [{
        title: '中文',
        dataIndex: '_id.name',
        width: 300,
        render: (value, src, idx) => {
            return <Input
                value={value}
                // onChange={(e) => this.handleChange(e, src, idx)}
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
    },
    {
        title: '英文',
        dataIndex: '_id.eName',
        width: 300,
        render: (value, src, idx) => {
            return <Input
                value={value}
                // onChange={(e) => this.handleChange(e, src, idx)}
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
        title: '被引用次数',
        dataIndex: 'total',
        width: 100,

    }
        //     , {
        //     title: '引用信息',
        //     dataIndex: 'pathArr',
        //     width: 100,
        //     render: (value, record, index) =>
        //         (<Button icon={'paper-clip'} onClick={() => { this.viewPath(value) }} >

        //         </Button>)
        // }
        , {
        title: '操作',
        dataIndex: 'pathArr',
        width: 100,
        render: (value, record, index) =>
            (<Radio.Group size="small" defaultChecked={false} >
                <Radio.Button value='查看引用' onClick={() => { this.viewPath(value) }} >
                    <Icon type={'paper-clip'} />
                </Radio.Button>
                <Radio.Button value='全局更新' onClick={() => { }} >
                    <Icon type={'sync'} />
                </Radio.Button>
            </Radio.Group>
            )
    },
        // {
        //     title: '生效状态',
        //     dataIndex: 'status',
        //     key: 'status',
        //     width: 100

        // }
    ];
    handleChange(v) {
        console.log(v);
    }
    // change(val, src, a) {
    //     var temp = this.state.list
    //     temp.find(item => item._id === src._id).eName = val
    //     console.log(temp);
    //     this.setState({
    //         list: temp
    //     })
    //     // this.props.list.find(unit => unit._id === src._id).eName = val
    //     // this.props.list.unshift({ name: 1 })
    // }
    viewPath(value) {
        this.setState({ showModel: true, pathArr: value });
    }
    getMore(src) {
        this.getList(src.current)
    }
    renderPathView() {
        let dataSource = this.state.pathArr.map(item => {
            let _path = item.location;
            return {
                platform: _path.startsWith('fe_pc') ? 'PC' : 'mobile',
                type: _path.includes('fe/apps') ? '模块入口' : (_path.includes('/fe/components/xb') ? "通用组件" : "业务组件"),
                name: _path.split('/').pop(),
                key: item.key
            }
        })
        let columns = [{
            title: '平台',
            dataIndex: 'platform',
            width: 100,
            filters: [{ text: 'PC', value: 'PC' }, { text: 'mobile', value: 'mobile' }],
            onFilter: (value, record) => record.platform.includes(value),
        }, {
            title: '类型',
            dataIndex: 'type',
            width: 100,
            filters: [{ text: '通用组件', value: '通用组件' }, { text: '模块入口', value: '模块入口' }, { text: '业务组件', value: '业务组件' }],
            onFilter: (value, record) => record.type.includes(value),
        }, {
            title: "文件名",
            dataIndex: "name",
        }]
        return (<div style={{ paddingRight: "20px" }}>
            <Table size="small" rowKey="key" dataSource={dataSource} columns={columns} scroll={{ y: 0 }} ></Table>
        </div>)
    }
    render() {
        return (
            <div>
                <Table style={{ border: '1px solid #e8e8e8', marginBottom: 30 }} rowKey="key" dataSource={this.state.list} columns={this.columns} onChange={src => this.getMore(src)} pagination={{ total: this.state.totalCount }}></Table>
                <Modal width={600} title={"字段引用信息"}
                    visible={this.state.showModel}
                    footer={null}
                    maskClosable={true}
                    onCancel={() => { this.setState({ showModel: false }) }}
                >
                    <ul>
                        {
                            this.state.pathArr && this.renderPathView()
                        }
                    </ul>
                </Modal>
            </div>
        )
    }
}
export default TotalTrans