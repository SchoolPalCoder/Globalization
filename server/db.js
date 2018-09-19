/*
    这个文件主要是数据库相关的部分，包括数据库连接、schema定义、初始化等等
*/
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost')
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'error aaa'));
db.once('open', () => {
    console.log('ok');
})
//双语表
var transSchema = mongoose.Schema({
    identifer: String,
    name: String,
    eName: String,
    module: String,
    branch: String,
    state: Boolean,
    location: String,
    history: Array,
    mTime: Date,
})
var trans = mongoose.model('Trans', transSchema);
//用户表
var userSchema = mongoose.Schema({
    username: String,
    password: String,
    isAdmin: Boolean
})
var user = mongoose.model('user', userSchema)
user.find({}, (err, item) => {
    if (!item.length) {
        user.create({
            username: 'admin',
            password: '123456',
            isAdmin: true
        })
    }
})
var appModuleSchema = mongoose.Schema({
    text:String,
    path:String,
    name:String,
    platform:String,
})
var appModule = mongoose.model('appModule', appModuleSchema)
var fs = require('fs')
var path = require('path')
const utils = require('./utils')
module.exports = {
    trans,
    user,
    appModule,
    mongoose
}