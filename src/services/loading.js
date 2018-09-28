import { message } from 'antd';

let loading

function startLoading() {
    loading = message.loading("加载信息中...",0);
}

function endLoading() {
    loading();
}
let needLoadingRequestCount = 0

function showFullScreenLoading() {
    if (needLoadingRequestCount === 0) {
        startLoading()
    }
    needLoadingRequestCount++
}

function tryHideFullScreenLoading() {
    if (needLoadingRequestCount <= 0) return
    needLoadingRequestCount--
    if (needLoadingRequestCount === 0) {
        endLoading()
    }
}
export {
    showFullScreenLoading,
    tryHideFullScreenLoading
}