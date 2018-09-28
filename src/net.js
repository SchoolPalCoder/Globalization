import axios from 'axios';
import { message } from 'antd';

import {showFullScreenLoading,tryHideFullScreenLoading} from "./services/loading";
axios.interceptors.response.use(res => {
    tryHideFullScreenLoading();
    return res.data
}, err => {
    tryHideFullScreenLoading();
    if (err.response.status === 401) {
        message.error("登录过期,请重新登录!")
        window.location.href = '/login'
    }
    return Promise.reject(err.response)
})
axios.interceptors.request.use(req=>{
    showFullScreenLoading();
    return req;
},err=>{
    return Promise.reject(err)
})
export default axios