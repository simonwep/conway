<h3 align="center">
    <img src="https://user-images.githubusercontent.com/30767528/80920127-1109df00-8d6e-11ea-96e4-71c4062dccfd.png" alt="Logo" height="400">
</h3>

<h3 align="center">
    Conway's <a href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life">Game of Life</a>. But Supercharged.
</h3>

<br/>

<p align="center">
  <a href="https://github.com/Simonwep/conways/actions"><img
     alt="Deployment Status"
     src="https://github.com/Simonwep/conway/workflows/Deployment/badge.svg"/></a>
  <a href="https://github.com/sponsors/Simonwep"><img
     alt="Support me"
     src="https://img.shields.io/badge/github-support-3498DB.svg"></a>
</p>


## What is this?
This is more or less just an experiment using (currently) latest web-technologies such as [Offscreen Canvas](https://developers.google.com/web/updates/2018/08/offscreen-canvas),
[Workers](https://web.dev/module-workers/) and [WebAssembly](https://webassembly.org/) using [Rust](https://www.rust-lang.org/) - all wrapped up inside of a [PWA](https://web.dev/progressive-web-apps/).
Unfortunately most non-Chromium based browsers lack certain features to run it, use [Brave](https://brave.com/), [Chrome](https://www.google.com/chrome/), [Opera](https://www.opera.com/) or any other
browser running Chromium in the background to get a reasonable experience.

## Setup
Clone it and install dependencies:
```bash
$ git clone https://github.com/Simonwep/conway
$ cd conway
$ npm install
```

You will also need to [install rust](https://www.rust-lang.org/tools/install) and [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) for WebAssembly,
afterwards you can run `npm run build` to build the project or `npm run dev` to spin up a dev-server :)

