import axios from 'axios'
import { message} from 'antd';
import React from "react";

axios.interceptors.response.use(res => {
    message.destroy()
    return res.data
}, err => {
    if (err.response.status === 401) {
        message.error("登录过期,请重新登录!")
        window.location.href = '/login'
    }
    return Promise.reject(err.response)
})
axios.interceptors.request.use(req=>{
    let aaa = message.loading("数据获取中...");
    console.log(aaa);
    return req;
},err=>{
    return Promise.reject(err)
})
export default axios