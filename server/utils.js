const shell = require('shelljs');
const config = require('config');
const {recursionDeepQueryModule} = require("./recursionDeepQueryModule");
const { appModule } = require("./db");
/**
 *返回工程目录的git 分支信息
 *
 * @returns {Array} 分支数组
 */
function getBranchList() {
    if (!shell.which('git')) {
        shell.echo('需要安装git');
        shell.exit(1);
        return [];
    }
    if (!config.get('projectPath')){
        shell.echo('请在config文件中指定项目路径');
        shell.exit(1);
        return [];
    }
    shell.cd(config.get('projectPath'));
    shell.exec('git fetch');
    shell.exec('git pull');
    let branches = shell.exec('git branch -a').stdout.split('\n');
    // localStorage.setItem('currentBranch', branches.find(item => {
    //     return item.startsWith('*');
    // }));
    return branches.filter(i => i.trim().startsWith('remotes'))
        .map(i => i.split('/').pop()).filter(i => i.match(/v(\.?\d)+/g)).reverse();
}


function getCurrentBranch() {
    if (!shell.which('git')) {
        shell.echo('requires git');
        shell.exit(1);
        return [];
    }
    shell.cd(config.get('projectPath'));
    shell.exec('git fetch');
    shell.exec('git pull');
    let branches = shell.exec('git branch ').stdout.split('\n');
    return branches.find(i => i.trim().startsWith('*'));
}
/**
 *将文本按照每行分割成数组
 *
 * @param {String} text 待分割文本
 * @returns {Array} 分割结果
 */
function getArrayByLine(text) {
    return text.replace(/\r\n/g, '\r').replace(/\n/g, '\r').split(',\r')
}
/**
 *获取项目中的语言包路径
 *
 * @returns {Array} 语言包路径集合
 */
function getLangPathStore() {
    const platformArr = ["pc", "mobile"],
        langDirArr = ["apps", "components"],
        filePathArr = [];
    platformArr.forEach(platform => {
        langDirArr.forEach(dir => {
            filePathArr.push(config.get('projectPath') + `Myth.SIS.Web/fe_${platform}/fe/${dir}/`)
        })
    })
    let arr = shell.find(filePathArr).filter(file => {
        return file.match(/lang.*\.js$/)
    });
    return arr;
}

function deleteQuotes(str) {
    let reg = /^['|"](.*)['|"]$/g;
    str = str.trim();
    let matchArr = str.trim().match(reg);
    if (matchArr) {
        return reg.exec(str)[1];
    } else {
        return str;
    }
}
let MIMES = {
    'css': 'text/css',
    'less': 'text/css',
    'gif': 'image/gif',
    'html': 'text/html',
    'ico': 'image/x-icon',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'js': 'text/javascript',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'swf': 'application/x-shockwave-flash',
    'tiff': 'image/tiff',
    'txt': 'text/plain',
    'wav': 'audio/x-wav',
    'wma': 'audio/x-ms-wma',
    'wmv': 'video/x-ms-wmv',
    'xml': 'text/xml',
    'unknown': 'unknown',
}
function scanModule() {
    
    const platformArr = ["pc", "mobile"],
        filePathArr = [];
    platformArr.forEach(platform => {
        filePathArr.push(config.get('projectPath') + `Myth.SIS.Web/fe_${platform}/fe/apps/`)
    })
    filePathArr.forEach(_path=>{
        let arr = shell.find(_path).filter(file => {
            return file.match(/index\.js$/)
        });
        arr.forEach(item=>{
            recursionDeepQueryModule(item);
        })
    })
}
module.exports = {
    getBranchList,
    getArrayByLine,
    getLangPathStore,
    deleteQuotes,
    getCurrentBranch,
    MIMES,
    scanModule
}