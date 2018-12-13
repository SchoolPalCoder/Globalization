/*
    这个文件用来维护api，具体该返回什么数据等等都在这里操作
*/
const { trans, user, appModule, mongoose } = require('./db')
const utils = require('./utils')
const config = require('config');
const shell = require('shelljs');

const { readFile, writeFile } = require('./fileIO');
const path = require('path')
const fs = require('fs')
const { MIMES } = require('./utils');
const _async = require('async');
// 解析资源类型
function parseMime(url) {
    let extName = path.extname(url)
    extName = extName ? extName.slice(1) : 'unknown'
    return MIMES[extName]
}
let option = {
    //翻译总表 批量修改
    batchEditTransList: async (ctx, next) => {
        let { keys, name, eName } = ctx.request.body;
        keys.forEach(e => {
            trans.findByIdAndUpdate(e, { name: name, eName: eName, state: false }, function (err, data) {
                if (err) return handleError(err);
                console.log(data);
            })
        })
        ctx.response.body = { state: true }
    },
    //获取翻译总表
    getTransTotalList: async (ctx, next) => {
        //state 0 全部状态 1未生效  2已生效
        let { key, state, pageIdx, pageSize } = ctx.request.body, dbQuery = {}; stateCode = { "0": [true, false], 1: [false], 2: [true] }
        dbQuery = {
            name: key && new RegExp(key),
            state: stateCode[state]
        }
        let match = { name: { $ne: null } }
        if (dbQuery.state.length == 1) {
            match.state = { $eq: dbQuery.state[0] }
        }
        let count,
            piplineArr = [

                { $match: match },
                {
                    $group: {
                        _id: { name: "$name", eName: "$eName" },
                        total: { $sum: 1 },
                        // state:{$in:[true]},
                        pathArr: { $push: { location: "$location", identifer: "$identifer", key: "$_id" } },
                        key: { $first: "$_id" },
                        state: { $first: "$state" }
                    }
                },

            ];

        if (key) {
            piplineArr[0] = { $match: { $or: [{ name: new RegExp(key) }, { eName: new RegExp(key) }] } }
        }
        let tempList = await trans.aggregate(piplineArr);

        count = tempList.length;
        piplineArr = piplineArr.concat([
            { $sort: { total: -1 } }
        ]);
        tempList = await trans.aggregate(piplineArr).skip(pageSize * (pageIdx - 1)).limit(pageSize);

        ctx.response.body = { list: tempList, currentIdx: pageIdx, totalCount: count }
    },
    //获取分支列表
    getBranchList: async (ctx, next) => {
        // utils.scanModule();
        ctx.response.body = await utils.getBranchList(1);
    },
    //获取模块列表
    getModuleList: async (ctx, next) => {
        let arr = await appModule.aggregate([{
            $sort: { path: 1 }
        }]).exec(), body = {};
        arr.forEach(item => {
            let type = item.platform;
            body[type] = body[type] || [];
            body[type].push(item);
        })
        ctx.response.body = body;
    },
    //修改模块显示名称
    modifyModuleText: async (ctx) => {
        let { id, text } = ctx.request.body;
        let module = await appModule.find({ _id: id });
        if (module && module.length) {
            let res = await appModule.update({ _id: mongoose.Types.ObjectId(id) }, { $set: { text: text } });
            ctx.response.body = res.nModified > 1 ? true : false;
        } else {
            ctx.response.body = false;
        }
        // module.update
    },
    //获取双语数据
    getData: async (ctx, next) => {

        var query = ctx.request.body
        var dbQuery, tempList, pathArr, count, _module
        if (query.module || query.branch) {
            if (query.module) {
                dbQuery = {
                    // module: query.module,
                }
                _module = await appModule.findOne({ _id: mongoose.Types.ObjectId(query.module) });
                pathArr = utils.scanModule(_module.path);
            }
            else {
                dbQuery = {
                    branch: query.branch,
                }
            }
        } else {
            if (query.state === true || query.state === false) {
                dbQuery = {
                    state: query.state,
                    name: new RegExp(query.key)
                }
            } else {
                dbQuery = {
                    name: new RegExp(query.key)
                }
            }

        }
        if (pathArr) {
            let reg = pathArr.map(i => `((fe_${query.platform}).*/${i})`).join('|');
            // dbQuery.location = new RegExp(reg)
            // count = await trans.count(dbQuery);
            //在正则最后添加当前模块js的路径 让apps的语言包也可以被检索出来
            reg += `|(${_module.path.split('/index.js')[0]})`
            let piplineArr = [

                { $match: { location: new RegExp(reg, 'i') } },
                {
                    $group: {
                        _id: "$location",
                        total: { $sum: 1 },
                        components: { $push: "$$ROOT" },
                        key: { $first: "$_id" },
                    },

                },
                { $sort: { total: -1 } }
            ];
            tempList = await trans.aggregate(piplineArr);
            for (var i = 0; i < tempList.length; i++) {
                //调试
                for (var item = 0; item < tempList[i].components.length; item++) {
                    var k = await trans.find({ name: tempList[i].components[item].name }).exec();
                    tempList[i].components[item].history = k.map(unit => unit.eName).filter((unit, idx, arr) => arr.indexOf(unit) === idx)
                }
            }
        } else {
            count = await trans.count(dbQuery)
            tempList = await trans.find(dbQuery).skip(query.page.pageSize * (query.page.pageIdx - 1)).limit(query.page.pageSize).exec()
            for (var i = 0; i < tempList.length; i++) {
                //调试
                var k = await trans.find({ name: tempList[i].name }).exec()
                tempList[i].history = k.map(unit => unit.eName).filter((unit, idx, arr) => arr.indexOf(unit) === idx)

            }
        }


        ctx.response.body = { list: tempList, currentIdx: query.page.pageIdx, totalCount: count }

    },
    syncData: async (ctx, next) => {
        console.time("时间")
        let branch = utils.getCurrentBranch().replace('*', '').trim();
        //#region 全库扫描字段
        let stor = utils.getLangPathStore();
        stor = stor.map(item => {
            let path = item.split('/');
            path.pop();
            return path.join('/')
        })
        //去重
        stor = [...new Set(stor)];
        let promiseArr = stor.map(async path => {
            const res = readFile(path, branch);
            return res;
        });
        //#region 更新mongo中的模块信息 
        const platformArr = ["pc", "mobile"],
            filePathArr = [];
        platformArr.forEach(platform => {
            filePathArr.push(config.get('projectPath') + `Myth.SIS.Web/fe_${platform}/fe/apps/`);
        })
        for (var i = 0; i < filePathArr.length; i++) {
            let arr = shell.find(filePathArr[i]).filter(file => {
                return file.match(/index\.js$/)
            });
            const modelPro = arr.map(async item => {
                let hasData = await appModule.find({
                    path: item.split('Myth.SIS.Web/')[1]
                })
                if (!hasData.length) {
                    return await appModule.create({
                        name: item.split('apps/')[1].split('/')[0],
                        path: item.split("Myth.SIS.Web/")[1],
                        text: item.split('apps/')[1].split('/')[0],
                        platform: item.includes('fe_mobile') ? 'Mobile' : 'PC',
                    })
                }
                return Promise.resolve();
            })
            promiseArr = promiseArr.concat(modelPro);
        }
        //#endregion
        return Promise.all(promiseArr)
            .then(() => {
                console.timeEnd("时间")
                ctx.response.body = { msg: 'langPathStore Finish' };
                console.log('the response status is ', ctx.status);
                console.log('langPathStore Finish');
            })
        //#endregion

    },
    //获取当前登录人
    getCurrentUser: async (ctx) => {
        ctx.response.body = {
            name: ctx.session.name,
            isAdmin: ctx.session.isAdmin
        }
    },
    //登录
    login: async (ctx) => {
        let { name, password } = ctx.request.body;
        let loginUser = await user.findOne({ username: name }).exec()
        if (loginUser && loginUser.password === password) {
            ctx.session = {
                name,
                password,
                isAdmin: loginUser.isAdmin
            }
            ctx.body = true
        }
        else {
            // ctx.body = false
            ctx.throw(401, 'wrong password')
        }
    },
    //导出
    export: async (ctx) => {
        let wholeList = await trans.find({ state: true }).exec()
        let inputstrCn = ''
        wholeList.forEach(item => {
            inputstrCn += "'" + item.identifer + "':'" + item.name + "',\n"
        })
        let inputstrEn = ''
        wholeList.forEach(item => {
            inputstrEn += "'" + item.identifer + "':'" + item.eName + "',\n"
        })
        //todo根据location分组
        let arrObj = {}
        let locationList = [... new Set(wholeList.map(item => item.location))]
        locationList.forEach(item => {
            arrObj[item] = wholeList.filter(unit => unit.location == item)
        })
        for (let i in arrObj) {
            writeF(true, i)
            writeF(false, i)
        }
        function writeF(flg, i) {
            let cnOutput = ''
            arrObj[i].forEach(item => {
                cnOutput += "'" + item.identifer + "':'" + item[flg ? 'name' : 'eName'] + "',\n"
            })
            let cnOut = `let $lang={
                ${cnOutput}
            }
            export default $lang`
            // console.log(`../${i}${flg ? '/lang.c.js' : '/lang.e.js'}`);
            writeFile(`../${i}${flg ? '/lang.c.js' : '/lang.e.js'}`, cnOut)
        }

        ctx.response.body = true

    },
    //生效接口（生效）
    enable: async (ctx, next) => {
        let req = ctx.request.body.list
        req.forEach(async (item) => {
            await trans.findByIdAndUpdate(item, { state: true }).exec()
        })
        ctx.response.body = true
    },
    //保存接口（未生效）
    save: async (ctx, next) => {
        let req = ctx.request.body.list
        req.forEach(async (item) => {
            await trans.findByIdAndUpdate(item._id, { eName: item.eName, state: false }).exec()
        })
        ctx.response.body = true
    },
    //上传图片
    upload: async (ctx, next) => {
        const filePath = ctx.origin + '/' + ctx.req.file.filename
        //todo 数据库中记录模块和文件路径的关系
        // ctx.req.body.module
        ctx.body = {
            file: filePath
        }
    },
    //静态资源
    bundleFile: async (ctx, next) => {
        if (parseMime(ctx.url) === 'unknown') {
            ctx.type = 'text/html'
            ctx.response.body = fs.readFileSync(path.join(__dirname, '../build/index.html'), 'binary')
        } else {
            ctx.type = parseMime(ctx.url)
            ctx.response.body = fs.readFileSync(path.join(__dirname, '../build/', ctx.url))
        }
    }
}
module.exports = option