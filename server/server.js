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
const serveStatic = require('koa-static')

const host = '127.0.0.1';
const port = 9090;
const app = new Koa();
// session配置
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
//文件上传配置
const storage = multer.diskStorage({
    //文件保存路径
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../build'))
    },
    //修改文件名称
    filename: function (req, file, cb) {
        const fileFormat = (file.originalname).split(".");  //以点分割成数组，数组的最后一项就是后缀名
        cb(null, Date.now() + '.' + fileFormat[fileFormat.length - 1]);
    }
})
//加载配置
const upload = multer({ storage });
app.use(session(CONFIG, app));
// or if you prefer all default config, just use => app.use(session(app));

app.use(async (ctx, next) => {
    await next()
    //鉴权
    if (!ctx.session.name) {
        ctx.throw(401, 'login please')
    }
});
app.use(serveStatic(path.join(__dirname, '../build')))
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
Router.get('/getModuleList',api.getModuleList)
Router.post('/modifyModuleText', api.modifyModuleText)
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
Router.post('/upload', upload.single('file'), api.upload)

// var prdEnv = process.env.NODE_ENV === 'production'
//生产环境中，除了api之外还需要提供静态资源
// 2018年09月15日23:07:00补充： 其实服务端不需要区分开发环境和生产环境，开发环境访问的是3000端口，服务端只提供api；生产环境访问9090端口，除api外还提供静态资源，所以直接写成服务端支持提供静态资源即可
// if (prdEnv) {
//这里下面的两个读文件的操作，貌似可以直接用ctx.sendFile()代替
//2018年09月18日22:29:38 自己写提供静态资源的方法已废弃，改用koa-static
// Router.get('/*', api.bundleFile)
// app.use(static('.'))
// }

app.use(Router.routes(), Router.allowedMethods({ throw: true }))

app.on('error', err => {
    console.error('server error', err)
});
app.listen(port, host, function (req, res) {
    console.log(`running at ${port}`);
})