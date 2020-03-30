const Watchpack = require('watchpack');
const shell = require('shelljs');
const path = require('path');

const NAME = 'WasmPackPlugin';
module.exports.WasmPackPlugin = class {

    constructor({crate = [], mode = 'production', debug = false}) {
        this.watchpack = new Watchpack();
        this.crates = (Array.isArray(crate) ? crate : [crate]);
        this.compiling = false;
        this.recompile = true;
        this.debug = debug;
        this.mode = mode;
        this.mount();
    }

    done(crate) {

        // Check if user changed something during compilation and restart
        this.compiling = false;
        if (this.recompile) {
            this.recompile = false;
            this.compileRust(crate);
        }
    }

    compileRust(crate) {

        // Check if compilation is currently active
        if (this.compiling) {
            this.recompile = true;
            return;
        }

        this.compiling = true;

        const cmd = `wasm-pack build "${crate}" ${this.mode === 'development' ? '--dev' : '--release'} --out-name index`;
        if (this.debug) {
            console.log(`Running ${cmd}`);
            const child = shell.exec(cmd, {async: true});
            child.on('close', () => this.done(crate));
        } else {
            const child = shell.exec(cmd, {
                silent: true,
                async: true
            });

            child.stderr.pipe(process.stderr);
            child.on('close', () => this.done(crate));
        }
    }

    mount() {
        this.watchpack.watch(
            [], this.crates.map(v => path.join(v, 'src'))
        );

        this.watchpack.on('change', filePath => {

            // Find source crate
            for (const crate of this.crates) {
                if (filePath.startsWith(crate)) {
                    this.compileRust(crate);
                    break;
                }
            }
        });
    }

    apply(compiler) {

        // Ignore crates in watch mode
        compiler.hooks.watchRun.tapAsync(NAME, (watcher, callback) => {
            if (!watcher.watcherOptions) {
                watcher.watcherOptions = {};
            }

            const opt = watcher.watcherOptions;
            if (opt.ignored) {
                if (!Array.isArray(opt.ignored)) {
                    opt.ignored = [opt.ignored];
                }
            } else {
                opt.ignored = [];
            }

            opt.ignored.push(...this.crates);
            callback();
        });
    }
};
