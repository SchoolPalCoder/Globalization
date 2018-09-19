
/*
* @Author xiaolong.zhu
* @Date 2018.9.14
* @Params: module-path:<string>
* @Comment: 双语平台页面模块引用统计
* @Fix: null
* @Fix-date: null
*
* */
function recursionDeepQueryModule(_path) {
    const fs = require('fs');
    const path = require('path');

    const matchxbCompReg = /xb(-\w+)+/g;

    const matchDirectivexbCompReg = /directive(-\w+)+/g;

    const matchCtrlCompReg = /components\/(.)+/g;

    let rtComps = [];
    let totalComps = [];

    try {
        let data = fs.readFileSync(_path, 'utf-8');
        const rtCtrl = data.indexOf('rt.controller');
        const result = data.slice(0, rtCtrl);
        const filterSingleQuoteData = result.replace(/'/g, '').replace(/\/\*+(.)+\*+\/|\/\/(.)+/g, '').replace(/\r\n+/g, '');

        const matchArrayResult = filterSingleQuoteData.split(';');

        let tempMatchArray = matchArrayResult.map(item => {

            if (item.match(matchxbCompReg) || item.match(matchCtrlCompReg)) {
                if (item.indexOf('baidu-statistics') === -1) {

                    let doPath = doGetModulePath(item);

                    if (doPath.indexOf('index') !== -1) {
                        return doPath.replace(/\/index$/g, '');
                    } else {
                        return doPath;
                    }
                }
            }
        }).filter(item => {

            return item !== undefined
        })/*.forEach(item => {
        totalComps.push(item.replace(/\.\/\.\.\/\.\.\/components\//g, ''));
        recursionQuery(item);
    });*/
        tempMatchArray.forEach(item => {
            totalComps.push(item.replace(/.*\/components\//g, '').trim());
            recursionQuery(item);
        })
    } catch (e) {
        if (e.code === 'ENOENT') {
            return;
        }
    }



    function recursionQuery(recursionItem) {
        try {
            let data = fs.readFileSync(recursionItem + '/index.js', 'utf-8');
            let rtComp = data.indexOf('rt.component');
            let compResult = data.slice(0, rtComp);
            let r0 = compResult.indexOf('let module');
            let r1 = compResult.indexOf('import userInfo');
            let r2 = compResult.indexOf('const');
            if (r0 !== -1) {
                compResult = compResult.slice(0, r0);
            } else if (r1 !== -1) {
                compResult = compResult.slice(0, r1);
            } else if (r2 !== -1) {
                compResult = compResult.slice(0, r2);
            }

            let afterFilterData = compResult.replace(/\/\/.+/g, '').replace(/'/g, '').replace(/\s*\*\s*\@property.+/g, '').replace(/\t\t\t\$\(body\).+/g, '').replace(/import(.)+xb-webpack-utils;/g, '');

            let matchArrayResult = afterFilterData.split('\r\n').map(item => {
                return item.match(/;$/g) ? item : item + ';'
            }).filter(item => {
                return item !== ';'
            });


            let tempMatchArray = matchArrayResult.map(item => {

                if (item.match(matchxbCompReg) || item.match(matchCtrlCompReg) || item.match(matchDirectivexbCompReg)) {
                    if (item.indexOf('baidu-statistics') === -1) {

                        let doPath = doGetModulePath(item);

                        if (doPath.indexOf('index') !== -1) {
                            return doPath.replace(/\/index$/g, '');
                        } else {
                            return doPath;
                        }
                    }
                }
            }).filter(item => {
                return item !== undefined
            });

            if (!tempMatchArray.length) {
                return;
            } else {
                tempMatchArray.forEach(item => {
                    totalComps.push(item.replace(/(\.\/\.\.\/\.\.\/components\/)|(\.\/\.\.\/\.\.\/)/g, ''))
                    recursionQuery(item)
                })
            }
        } catch (e) {
            if (e.code === 'ENOENT') {
                return;
            }
        }
    }
    function doGetModulePath(item) {
        return item.replace(/^import\s*.+\.\./g, './../..').replace(/;$/g, '').replace(/\/$/g, '');
    }

    console.log(totalComps);
    console.log([...new Set(totalComps)]);
}

module.exports.recursionDeepQueryModule = recursionDeepQueryModule;