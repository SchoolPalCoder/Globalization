import React, { Component } from 'react';
import logo from '../logo.svg';
import './App.css';
// eslint-disable-next-line
import { Layout, Tabs, Icon, Divider, Upload, Input, Select, Pagination, Radio, Menu, Button, Card, message } from 'antd'
import axios from '../net'
import MultiTable from '../table/table';
import TotalTrans from "../totalTrans";

const Dragger = Upload.Dragger



class App extends Component {
  _this = this
  state = {
    list: [],
    totalCount: 0,
    branchList: [],
    moduleList: [],
    selectByBranch: true,
    defaultBranch: '',
    docType: true,
    transAllFilter: {},
    currentUser: {},
    picture: ''
  }

  componentDidMount() {
    //获取登录人
    axios.get('/getCurrentUser').then(res => {
      this.setState({
        currentUser: res
      })
    })
    //获取分支列表
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
    //获取模块列表
    axios.get('/moduleList').then(data => {
      this.setState({
        moduleList: data
      })
    })
    this.getData = ({ branch, module, key, page = { pageIdx: 1, pageSize: 10 }, state }) => {
      axios.post('/data', { branch, module, key, page, state }).then(data => {
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
      },
      state: '',
      changeToAllType: function () {
        //切换到全部翻译
        this.branch = ''
        this.module = ''
        this.key = ''
        this.page.pageIdx = 1
        this.state = ''
      },
      changeToPageType: function () {
        //切换到页面翻译
        this.branch = 'v1.0';
        this.module = '';
        this.key = '';
        this.page.pageIdx = 1;
        this.state = ''
      }
    }

  }
  //刷新，用于table里取消按钮的回调
  refresh() {
    this.getData(this.searchParam)
  }
  //点击页码的回调
  pageFun(page) {
    this.searchParam.page.pageIdx = page.current
    this.getData(this.searchParam)
  }
  //将现有的双语同步到数据库
  syncData() {
    axios.post('/syncData', { branch: this.searchParam.branch }).then(data => {
      console.log(data);
    })
  }
  //在页面翻译和翻译总表切换的回调
  changeDocType(flg) {
    this.setState({
      docType: flg
    })
  }
  //导出
  export() {
    axios.get('/export').then(res => {

    })
  }
  render() {
    const fileConfigs = {
      name: 'file',
      multiple: false,
      listType: 'picture',
      //后端接口
      action: '/upload',
      onChange: (info) => {
        const status = info.file.status;
        if (status !== 'uploading') {
          console.log(info.file, info.fileList);
        }
        if (status === 'done') {
          message.success(`${info.file.name} file uploaded successfully.`);
          this.setState({
            picture: info.file.response.file
          })
          console.log(this.state);
        } else if (status === 'error') {
          message.error(`${info.file.name} file upload failed.`);
        }
      },
    };
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
          <Radio.Group defaultValue='页面翻译'>
            <Radio.Button value='页面翻译' onClick={() => { this.changeDocType(true); this.searchParam.changeToPageType(); this.getData(this.searchParam) }}>页面翻译</Radio.Button>
            <Radio.Button value='翻译总表' onClick={() => { this.changeDocType(false); this.searchParam.changeToAllType(); this.getData(this.searchParam) }} >翻译总表</Radio.Button>
          </Radio.Group>
        </div>
        <div>
          <span>筛选：</span>
          {this.state.docType ?
            <div>
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
              <Dragger {...fileConfigs} >
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files</p>
              </Dragger>
            </div> :
            <div>
              <Select style={{ width: 120, display: 'inline-block' }} defaultValue="全部" onSelect={(val) => {
                let transAllFilter = Object.assign(this.state.transAllFilter, { type: val === '0' ? '' : (val === '1' ? false : true) });
                this.setState({ transAllFilter })
              }}>
                <Select.Option key='0'>全部</Select.Option>
                <Select.Option key='1'>未生效</Select.Option>
                <Select.Option key='2'>已生效</Select.Option>

              </Select>
              <Input.Search enterButton style={{ width: 260, marginLeft: 30 }} onSearch={value => {
                this.setState({ transAllFilter: Object.assign(this.state.transAllFilter, { key: value }) }
                )
              }}></Input.Search>

            </div>

          }


        </div>
        <div style={{ textAlign: 'left' }}>
          <span>版本/模块:</span>
          <span>招生</span>
          <Button style={{ float: 'right' }} onClick={() => this.export()}>导出</Button>
          <Button onClick={this.syncData.bind(this)} style={{ float: 'right', marginRight: '10px' }}>同步数据</Button>
        </div>
        {this.state.docType ?
          <div>
            <div style={{ padding: '20px' }}>
              <Card

                style={{ width: '100%', height: 240, overflow: 'auto' }}
                cover={<img alt="相关图片" src={this.state.picture} />}
              ></Card>
            </div>
            <MultiTable user={this.state.currentUser} list={this.state.list} count={this.state.totalCount} fresh={() => this.refresh()} getMore={(src) => this.pageFun(src)} editable={true} ></MultiTable>
          </div> :
          <div>
            <TotalTrans searchParam={this.state.transAllFilter}></TotalTrans>
          </div>
        }

      </div>
    )
  }
}

export default App;
