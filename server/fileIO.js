/*
    这个文件单独拎出来，为了把读取文案的部分与其他服务区分开来，在这里可以更独立的做一些测试等等
*/
const trans = require('./db')
var fs = require('fs')
const utils = require('./utils')
//同步数据时读文件
async function readFile(_path, branch = 'master') {
    var cnRes = fs.readFileSync(_path + "/lang.cn.js")
    try {
        if (!cnRes.toString('utf-8').match(/\{(.|\n|\r\n)+\}/g)) return;
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
        let temp1 = Object.keys(enObj).length < Object.keys(cnObj) ? cnObj : enObj;
        Object.keys(temp1).forEach(async (key, idx) => {
            let item = temp1[key];
            if (!item) return;
            let identifer = key;
            //英文和中文索引一样的情况
            let tran = {
                identifer,
                name: cnObj[key],
                eName: enObj[key],
                location: _path,
                module: 'home',
            };
            let queryTran = await trans.find(tran).exec();
            if (!queryTran.length) {
                await trans.create({
                    branch,
                    ...tran
                });
            }
        })
    } catch (error) {
        console.log(error + ',path:' + _path);
    }




}
//导出时写文件
function writeFile(_path, src) {
    fs.openSync(_path, 'a')//a代表不存在的时候就新建
    fs.writeFileSync(_path, src)
}
module.exports = { readFile, writeFile }