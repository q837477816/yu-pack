#! /usr/bin/env Node

// 1) 需要找到当前执行名的路径 拿到webpack.webkitConvertPointFromPageToNode.js

let path = require('path')

// config配置文件
let config = require(path.resolve(__dirname))

let Compiler = require('../lib/Compiler')
let compiler = new Compiler(config)
// 标识运行编译
compiler.run()