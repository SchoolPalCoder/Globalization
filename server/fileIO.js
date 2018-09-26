/*
    这个文件单独拎出来，为了把读取文案的部分与其他服务区分开来，在这里可以更独立的做一些测试等等
*/
const { trans } = require('./db')
var fs = require('fs')
const utils = require('./utils')

//同步数据时读文件
function readFile(_path, branch = 'master') {
    
    return new Promise((res,rej)=>{
        try {
            if (!fs.existsSync(_path + "/lang.cn.js")) {
                res();
                return ;
            }
            var cnRes = fs.readFileSync(_path + "/lang.cn.js");
            if (!cnRes.toString('utf-8').match(/\{(.|\n|\r\n)+\}/g)){res(); return;}
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
            let finishArr = [];
            Object.keys(temp1).forEach((key, idx) => {
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
                finishArr.push(new Promise((resolve,reject)=>{
                    trans.find(tran).exec((err, _tran) => {
                        if (err) {
                            console.log(err);
                            reject(err)
                            return;
                        }
                        if (!_tran.length) {
                            resolve()
                            // trans.create({
                            //     branch,
                            //     ...tran
                            // }, (err, result) => {
                            //     if (err) console.log(err);
                            //     console.log(result);
                            //     resolve()
                            //     console.log("create:" + tran.name);
                            // });
                        } else {
                            resolve()
                        }
                    });
                }))
            })
            Promise.all(finishArr)
            .then(data=>{
                res();
            })
            .catch(err=>{
                rej(err);
            })
            if (!Object.keys(temp1).length) res();
        } catch (error) {
            rej(error);
            console.log(error + ',path:' + _path);
        }
    })
}
//导出时写文件
function writeFile(_path, src) {
    fs.openSync(_path, 'a')//a代表不存在的时候就新建
    fs.writeFileSync(_path, src)
}
module.exports = { readFile, writeFile}