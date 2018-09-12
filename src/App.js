import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
// eslint-disable-next-line
import { Layout, Tabs, Icon, Divider, Upload, Input, Select, Pagination, Radio, Menu, Button, Card, message } from 'antd'
import axios from './net'
import MultiTable from './table';
import TotalTrans from "./totalTrans";

const Dragger = Upload.Dragger
const fileConfigs = {
  name: 'file',
  multiple: true,
  //后端接口
  // action: '//jsonplaceholder.typicode.com/posts/',

  onChange(info) {
    const status = info.file.status;
    if (status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (status === 'done') {
      message.success(`${info.file.name} file uploaded successfully.`);
    } else if (status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  },
};

class App extends Component {
  _this = this
  state = {
    list: [],
    totalCount: 0,
    branchList: [],
    moduleList: [],
    selectByBranch: true,
    defaultBranch: '',
    viewType: '页面翻译',
    totalTrans: []
  }
  componentDidMount() {
    axios.get('/branchList').then(data => {
      this.setState({
        branchList: data,
        defaultBranch: data[0]
      }, () => {
        this.searchParam.branch = this.state.defaultBranch;
      })

    }).then(() => {
      this.getData(this.searchParam)
    })
    axios.get('/moduleList').then(data => {
      this.setState({
        moduleList: data
      })
    })
    this.getData = ({ branch, module, key, page = { pageIdx: 1, pageSize: 10 } }) => {
      axios.post('/data', { branch, module, key, page }).then(data => {
        this.setState({
          list: data.list,
          totalCount: data.totalCount
        })
      })
    }
    this.searchParam = {
      branch: 'v1.0',
      module: '',
      key: '',
      page: {
        pageIdx: 1,
        pageSize: 10
      }
    }

  }
  pageFun(page) {
    this.searchParam.page.pageIdx = page.current
    this.getData(this.searchParam)
  }
  syncData() {
    axios.post('/syncData', { branch: this.searchParam.branch }).then(data => {
      console.log(data);
    })
  }
  viewTypeChange() {
    switch (this.state.viewType) {
      case "翻译总表":
        // axios.post('/getTransTotalList', { pageIdx: 1, pageSize: 10 }).then(data => {
        //   this.setState({
        //     totalTrans: data
        //   })
        // })
        break;

      default:
        break;
    }
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          {/* <h1 className="App-title">Welcome to React</h1> */}
        </header>
        {/* <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p> */}
        {/* <div style={{margin:'0 auto'}}> */}
        <div>
          <Radio.Group defaultValue='页面翻译' onChange={(item) => {
            console.log();
            this.setState({ viewType: item.target.value }, this.viewTypeChange)
          }
          }>
            <Radio.Button value='页面翻译'>页面翻译</Radio.Button>
            <Radio.Button value='翻译总表'>翻译总表</Radio.Button>
          </Radio.Group>
        </div>
        <div>
          <span>筛选：</span>
          <Radio.Group defaultValue="1" onChange={() => this.setState({ selectByBranch: !this.state.selectByBranch })}>
            <Radio value="1">按版本</Radio>
            <Select
              defaultValue={this.state.defaultBranch}
              style={{ width: 120 }}
              onChange={(val) => { this.searchParam.branch = val; this.getData(this.searchParam) }}
              disabled={!this.state.selectByBranch}>
              {this.state.branchList.map(item => (<Select.Option key={item} value={item}>{item}</Select.Option>))}
            </Select>
            <Radio value="2">按模块</Radio>
            {/* <Dropdown overlay={ModuleList} trigger={['click']}> */}
            <Select defaultValue='首页' style={{ width: 120 }} onSelect={(val) => { this.searchParam.module = val; this.getData(this.searchParam) }} disabled={this.state.selectByBranch}>
              {this.state.moduleList.map(item => (<Select.Option key={item} value={item}>{item}</Select.Option>))}
            </Select>
          </Radio.Group>
          <Dragger {...fileConfigs}></Dragger>
        </div>
        {
          this.state.viewType === "页面翻译" ?
            <div>
              <div style={{ textAlign: 'left' }}>
                <span>版本/模块:</span>
                <span>招生</span>
                <Button style={{ float: 'right' }}>编辑</Button>
                <Button onClick={this.syncData.bind(this)} style={{ float: 'right', marginRight: '10px' }}>同步数据</Button>
              </div>
              <div style={{ padding: '20px' }}>
                <Card

                  style={{ width: '100%' }}
                  cover={<img alt="1" src="http://ok0nex8hq.bkt.clouddn.com/1533051037.png" />}
                ></Card>
              </div>
              <div>
                <MultiTable list={this.state.list} count={this.state.totalCount} getMore={(src) => this.pageFun(src)} editable={true} ></MultiTable>
              </div>
              <div>
                <Button>取消</Button>
                <Button>保存</Button>
                <Button>生效</Button>

              </div>
            </div> :
            <TotalTrans></TotalTrans>
        }

      </div>
    );
  }
}

export default App;
