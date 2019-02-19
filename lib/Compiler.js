let fs = require('fs');
let path = require('path');
let babylon = require('babylon');
let t = require('@babel/types');
let traverse = require('@babel/traverse').default;
let generator = require('@babel/generator').default;
// babylon 主要就是把源码转换成ast
// @babel/traverse 遍历节点
// @babel/types 替换
// @babel/generator 生成
class Compiler {
    constructor(config) {
        // entry output
        this.config = config;
        // 需要保持入口文件的路径
        this.entryId;
        // 需要保持所有的模块依赖
        this.modules = {};
        this.entry = config.entry; // 入口路径
        this.root = process.cwd(); //工作路径
    }

    getSource(modulePath) {
        let content = fs.readFileSync(modulePath, 'utf8');
        return content;
    }

    parse(source, parentPath) { // 解析源码(主要靠AST解析语法树)
        let ast = babylon.parse(source);
        let dependencies = []; // 依赖的数组
        traverse(ast, {
            CallExpression(p) {
                let node = p.node; // 对应的节点
                if (node.callee.name === 'require') {
                    node.callee.name = '__webpack_require__';
                    let moduleName = node.arguments[0].value; // 取到的就是模块的引用名字
                    moduleName = moduleName + (path.extname(moduleName) ? '' : 'js');
                    moduleName = './' + path.join(parentPath, moduleName);
                    dependencies.push(moduleName);
                    node.arguments = [t.stringLiteral(moduleName)];
                }
            }
        });
        let sourceCode = generator(ast).code;
        return { sourceCode, dependencies };
    }

    buildModule(modulePath, isEntry) { // 构建模块
        // 拿到模块的内容
        let source = this.getSource(modulePath);
        // 模块id
        let moduleName = './' + path.relative(this.root, modulePath); // 获取模块的相对路径
        if (isEntry) {
            this.entryId = moduleName; // 保持入口的名字
        }
        // 解析需要把source源码进行改造 返回一个依赖列表
        let {sourceCode, dependencies} = this.parse(source, path.dirname(moduleName));
        // 把相对路径和模块中的内容对应起来
        this.modules[moduleName] = sourceCode;
        dependencies.forEach(dep => { // 附模块的加载（递归加载）
            this.buildModule(path.join(this.root, dep), false);
        });
    }

    emitFile() { // 发射文件
        
    }

    run() {
        // 执行 并且创建模块的依赖关系
        this.buildModule(path.resolve(this.root, this.entry), true);

        // 发射一个文件 打包后的文件
        this.emitFile();
    }
}
module.exports = Compiler