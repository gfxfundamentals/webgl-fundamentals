Title: WebGL Setup and Installation
Description: How to do WebGL development

Techincally you don't need anything other than a web browser to do WebGL
development. Go to [jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/) or [jsbin.com](http://jsbin.com)
or [codepen.io](http://codepen.io/greggman/pen/YGQjVV) and just start applying the lessons here.

On all of them you can reference external scripts by adding a `<script src="..."></script>`
tag pair if you want to use external scripts.

Still, there are limits. WebGL has stronger restrictions than Canvas2D for loading images
which means you can't easily access images from around the web for your WebGL work.
On top of that it's just faster to work with everything local.

Let's assume you want to run and edit the samples on this site. The first thing you should
do is download the site. [You can download it here](https://github.com/greggman/webgl-fundamentals/).

{{{image url="resources/download-webglfundamentals.gif" }}}

Unzip the files into some folder.

## Using a small simple easy Web Server

Next up you should install a small web server. I know "web server" sounds scary but the truth is [web
servers are actually extremely simple](http://games.greggman.com/game/saving-and-loading-files-in-a-web-page/).

Here's a very simple one with an interface called [Servez](https://greggman.github.io/servez).

{{{image url="resources/servez.gif" }}}

Just point it at the folder where you unzipped the files, click "Start", then go to
in your browser [`http://localhost:8080/webgl/`]()`http://localhost:8080/webgl/) and choose
a sample.

If you prefer the command line, another way is to use [node.js](https://nodejs.org).
Download it, install it, then open a command prompt / console / terminal window. If you're on Windows the installer
will add a special "Node Command Prompt" so use that.

Then install the [`http-server`](https://github.com/indexzero/http-server) by typing

    npm -g install http-server

If you're on OSX use

    sudo npm -g install http-server

Once you've done that type

    http-server path/to/folder/where/you/unzipped/files

It should print something like

{{{image url="resources/http-server-response.png" }}}

Then in your browser go to [`http://localhost:8080/webgl/`](http://localhost:8080/webgl/).

If you don't specify a path then http-server will server the current folder.

## Using your Browsers Developer Tools

Most browser have extensive developer tools built in.

{{{image url="resources/chrome-devtools.png" }}}

[Docs for Chrome's are here](https://developers.google.com/web/tools/chrome-devtools/),
[Firefox's are here](https://developer.mozilla.org/en-US/docs/Tools).

Learn how to use them. If nothing else always check the JavaScript console. If there is an issue it will often have
an error message. Read the error message closely and you should get a clue where the issue is.

{{{image url="resources/javascript-console.gif" }}}

## WebGL Helpers

There are various WebGL Inspectors / Helpers. [Here's one for Chrome](https://benvanik.github.io/WebGL-Inspector/).

{{{image url="https://benvanik.github.io/WebGL-Inspector/images/screenshots/1-Trace.gif" }}}

[Firefox also has a similar one](https://hacks.mozilla.org/2014/03/introducing-the-canvas-debugger-in-firefox-developer-tools/).
It needs to be enabled in `about:flags` and might required the [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/).

They may or may not be helpful. Most of them are designed for animated samples and will capture a frame
and let you see all the WebGL calls that made that frame. That's great if you already have something
working or if you had something working and it broke. But it's not so great if your issue is during
initialization which they don't catch or if you're not using animation, as in drawing something every frame.
Still they can be very useful. I'll often click on a draw call, and check the uniforms. If I see a
bunch of `NaN` (NaN = Not a Number) then I can usually track down the code that set that uniform and
find the bug.

## Inspect the Code

Also always remember you can inspect the code. You can usually just pick view source

{{{image url="resources/view-source.gif" }}}

Even if you can't right click a page or if the source is in a separate file
you can always view the source in the devtools

{{{image url="resources/devtools-source.gif" }}}

## Get Started

Hopefully that helps you get started. [Now back to the lessons](/).
