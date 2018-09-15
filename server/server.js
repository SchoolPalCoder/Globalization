/*
    这个文件是启动HTTP服务，设置路由，具体操作由api文件维护
*/
const Koa = require('koa');
const Router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const session = require('koa-session')
const utils = require('./utils')
const path = require('path')

const multer = require('koa-multer')

const api = require('./api')
const { MIMES } = require('./utils')
const fs = require('fs')
var app = new Koa();
app.keys = ['some secret hurr'];
const CONFIG = {
    key: 'koa:sessuu', /** (string) cookie key (default is koa:sess) */
    /** (number || 'session') maxAge in ms (default is 1 days) */
    /** 'session' will result in a cookie that expires when session/browser is closed */
    /** Warning: If a session cookie is stolen, this cookie will never expire */
    maxAge: 86400000,
    overwrite: true, /** (boolean) can overwrite or not (default true) */
    httpOnly: true, /** (boolean) httpOnly or not (default true) */
    signed: true, /** (boolean) signed or not (default true) */
    rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
    renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
};

app.use(session(CONFIG, app));
// or if you prefer all default config, just use => app.use(session(app));

app.use(async (ctx, next) => {
    // ignore favicon
    // if (ctx.path === '/favicon.ico') return;
    await next()
    //鉴权
    if (!ctx.session.name) {
        ctx.throw(401, 'login please')
        // ctx.response.body = { to: 'login' }
    }
    // ctx.body = n + ' views';
});

var host = '127.0.0.1';
var port = 9090;
app.use(bodyParser())
Router.post('/login', api.login)

Router.get('/branchList', api.getBranchList)
Router.get('/moduleList', api.getModuleList)
Router.get('/export', api.export)
Router.post('/syncData', api.syncData)
Router.post('/data', api.getData)
Router.post('/getTransTotalList', api.getTransTotalList)
Router.post('/save', api.save)
Router.post('/enable', api.enable)
Router.get('/getCurrentUser', api.getCurrentUser)
//文件上传
//配置
var storage = multer.diskStorage({
    //文件保存路径
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../build/static/files'))
    },
    //修改文件名称
    filename: function (req, file, cb) {
        var fileFormat = (file.originalname).split(".");  //以点分割成数组，数组的最后一项就是后缀名
        cb(null, Date.now() + "." + fileFormat[fileFormat.length - 1]);
    }
})
//加载配置

var upload = multer({ storage });
Router.post('/upload', upload.single('file'), api.upload)
// 解析资源类型
function parseMime(url) {
    let extName = path.extname(url)
    extName = extName ? extName.slice(1) : 'unknown'
    return MIMES[extName]
}
var prdEnv = process.env.NODE_ENV === 'production'
//生产环境中，除了api之外还需要提供静态资源
if (prdEnv) {
    //这里下面的两个读文件的操作，貌似可以直接用ctx.sendFile()代替
    Router.get('/*', async (ctx, next) => {

        if (parseMime(ctx.url) === 'unknown') {
            // if (ctx.url === '/') {
            ctx.type = 'text/html'
            ctx.response.body = fs.readFileSync(path.join(__dirname, '../build/index.html'), 'binary')
        } else {
            ctx.type = parseMime(ctx.url)
            ctx.response.body = fs.readFileSync(path.join(__dirname, '../build/', ctx.url))
        }
    })
    // app.use(static('.'))
}

app.use(Router.routes(), Router.allowedMethods())
// app.all('*', function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
//     res.header("X-Powered-By", ' 3.2.1')
//     res.header("Content-Type", "application/json;charset=utf-8");
//     next();
// });
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

app.on('error', err => {
    console.error('server error', err)
});
app.listen(port, host, function (req, res) {
    console.log(`running at ${port}`);
})