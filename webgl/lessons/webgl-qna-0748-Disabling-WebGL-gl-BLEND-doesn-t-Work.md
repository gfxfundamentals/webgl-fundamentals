Title: Disabling WebGL gl.BLEND doesn't Work
Description:
TOC: qna

# Question:

I use `THREE.js` and enable alpha canvas: (because I need to build my WebGL on top of something else)

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: true });

I set the clear color like this:

    this.renderer.setClearColor(0xffffff, 0.0);

In each frame:

    _render () {
        renderer.clear();
        gl.disable(gl.BLEND);
        // ... something else doesn't need to be blended, whose alpha value is not 1.0
    }

I'm curious why something else still gets blended with the white background even if I disable `gl.BLEND`.


# Answer

three.js controls the blending. When you call `renderer.render` it will set the blending calling `gl.enable(gl.BLEND)` for each material depending on whether or not that material needs blending.

On top of that, even with blending off you can draw with a non 1.0 alpha which will end up giving use a canvas that can see through to the background.
