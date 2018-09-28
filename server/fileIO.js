/*
    这个文件单独拎出来，为了把读取文案的部分与其他服务区分开来，在这里可以更独立的做一些测试等等
*/
const { trans } = require('./db')
var fs = require('fs')
const utils = require('./utils');
const _async = require("async")

//同步数据时读文件
async function readFile(_path, branch = 'master') {
    // console.time("Time")
    // return new Promise(async (res,rej)=>{
    try {
        if (!fs.existsSync(_path + "/lang.cn.js")) {
            return;
        }
        var cnRes = fs.readFileSync(_path + "/lang.cn.js");
        if (!cnRes.toString('utf-8').match(/\{(.|\n|\r\n)+\}/g)) { return; }
        let cnObj = cnRes.toString('utf-8').match(/\{(.|\n|\r\n)+\}/g);
        //防止有些文件为空的情况下报错
        cnObj = cnObj ? cnObj[0] : "{}";
        cnObj = new Function("return " + cnObj)();
        var enRes = fs.readFileSync(_path + "/lang.en.js")
        let enObj = enRes.toString('utf-8').match(/\{(.|\n|\r\n)+\}/g);
        //防止有些文件为空的情况下报错
        enObj = enObj ? enObj[0] : "{}";
        enObj = new Function("return " + enObj)()
        // enList = enList.concat(utils.getArrayByLine(enObj))
        //定义个临时变量 用来存储长度更大的 ,这样遍历更大的数组才可以保证入库的字段基本齐全
        let temp1 = Object.keys(enObj).length < Object.keys(cnObj).length ? cnObj : enObj;
        //并发连接数的计数器
        var concurrencyCount = 0;
        const pro = new Promise((pro_res, rej) => {
            //使用第三方async方法库 限制每次map的并发最大数为1 相当于把全部的并发 串联起来 实测可以大大的加快运算效率
            _async.mapLimit(Object.keys(temp1), 1, async function (key) {
                let item = temp1[key];
                if (!item && item !== "") return;
                let identifer = key;
                //英文和中文索引一样的情况
                let tran = {
                    identifer,
                    name: cnObj[key],
                    eName: enObj[key],
                    location: _path.split('Myth.SIS.Web/')[1],
                    module: 'home',
                };
                return new Promise(async (resolve, rej) => {
                    concurrencyCount++;
                    const _tran = await trans.find(tran);
                    // console.log('并发数:', concurrencyCount--, 'name:', tran.name);
                    if (!_tran.length) {
                        trans.create({
                            branch,
                            ...tran
                        }).then(() => {
                            console.log("create:" + tran.name);
                            resolve()
                        });
                    } else {
                        resolve();
                    }
                })
            }, () => {
                pro_res();
            })
        })
        return pro;
    } catch (error) {
        console.log(error + ',path:' + _path);
        return error;
    }
    // })
}
//导出时写文件
function writeFile(_path, src) {
    fs.openSync(_path, 'a')//a代表不存在的时候就新建
    fs.writeFileSync(_path, src)
}
module.exports = { readFile, writeFile }