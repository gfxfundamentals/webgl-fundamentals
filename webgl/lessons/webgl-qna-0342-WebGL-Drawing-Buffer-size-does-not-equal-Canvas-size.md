Title: WebGL Drawing Buffer size does not equal Canvas size
Description:
TOC: qna

# Question:

I have a webapp that uses three.js to draw multiple webgl layers, and I am sometimes getting (in Chrome) the layers with drawingBufferHeight & drawingBufferWidth that are not equal to the canvas height & width.

Each layer can be turned on and off.  I have a stack of them so they are reused:

    Layers.GLRendererPool = new (function() {
        this.renderers = [];
        this.getRenderer = function() {
            if(this.renderers.length == 0) {
                var r = new THREE.WebGLRenderer({ alpha: true });
                r.setClearColor(0x000000, 0);
                return r;
            } else {
                var r = this.renderers.shift();
                return r;
            }
        };
        this.saveRenderer = function(r) {
            r.setSize(0, 0); //EXPERIMENTAL
            this.renderers.push(r);
        };
        return this;
    })();

They are resized after getting them using THREE.WebGLRenderer.setSize().  After calling setSize(), canvas.width == renderer.context.drawingBufferWidth and canvas.height == renderer.context.drawingBufferHeight, but not always.  They are not equal even if I only have 1 renderer currently in use.

Any ideas why this happens?  I was assuming that there were some limits on video card memory, and I tried calling setSize(0, 0) on every renderer that is not in use, but no luck there.  Is this a Chrome + WebGL bug?

# Answer

There are multiple issues.

1.  Depending on the version of three.js it might magically multiply your width and height by `window.devicePixelRatio` which means your canvas will be a different size than you asked for if the device pixel ratio is not 1. It will not be 1 on pretty much any smartphone of the last 2-3 years.

2.  You're out of memory (as far as chrome is concerned). [The WebGL spec allows for the drawingBuffer to be smaller than requested](https://www.khronos.org/registry/webgl/specs/latest/1.0/#2.2). This is precisely why `drawingBufferWidth` and `drawingBufferHeight` exist so you can check what size it made the drawingBuffer.

The original motivation for this is because GPUs only support canvases (which are made from textures) of a certain size. If you have multiple monitors and you stretch a window across them it's easy to make something larger than whatever that limit is. So WebGL had a few choices (1) crash/throw an exception. That would likely break most programs and users would lose data (2) don't make the drawingBuffer larger than the max size but let it be stretched to fit the size requested.

Beyond that motivation though a WebGL implementation can also use the same part of the spec to give you a canvas smaller than you asked for for any reason. The most common reason is you're out of memory so it tries to make the size you requested, fails, and tries to make progressively smaller size until it succeeds

Well, that's the long explanation.

I'd file a bug at [crbug.com](http://crbug.com) as it seems like chrome recently added an arbitrary 512meg limit to each webpage and it's causing problems for many users.
