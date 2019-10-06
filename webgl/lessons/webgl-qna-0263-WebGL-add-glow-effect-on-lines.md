Title: WebGL add glow effect on lines
Description:
TOC: qna

# Question:

I would like to add glow effect on line of my graph in webgl like [the Interactive Globe: Small Arms Imports & Exports](http://armsglobe.chromeexperiments.com/).

I'm using the library Vivagraph.js to display nodes and links, not Threejs.

Fragment Shader:

    precision mediump float;
    varying vec4 color;
    void main(void) {
        gl_FragColor = color;
    }
Vertex Shader:

    attribute vec2 a_vertexPos;
    attribute vec4 a_color;
    uniform vec2 u_screenSize;
    uniform mat4 u_transform;
    varying vec4 color;
    void main(void) {
        gl_Position = u_transform * vec4(a_vertexPos/u_screenSize, 0.0, 1.0);
        color = a_color.abgr;
    }

The render function:

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, storage, gl.DYNAMIC_DRAW);

    if (sizeDirty) {
        sizeDirty = false;
        gl.uniformMatrix4fv(locations.transform, false, transform);
        gl.uniform2f(locations.screenSize, width, height);
    }

    gl.vertexAttribPointer(locations.vertexPos, 2, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(locations.color, 4, gl.UNSIGNED_BYTE, true, 3 * Float32Array.BYTES_PER_ELEMENT, 2 * 4);
    gl.drawArrays(gl.LINES, 0, linksCount * 2);
    frontLinkId = linksCount - 1;

Have you any idea to add information about glow on fragment shader ?
Thx

# Answer

glow is almost always a post-processing effect. You draw your scene into a texture by attaching a canvas size texture to a framebuffer. You then render that texture to the canvas applying yet another shader that does some effect like glowing.

In other words you can't just add glow to your example above by modifying the fragment shader. you need another set of shaders
