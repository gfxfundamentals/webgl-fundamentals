Title: How do I simulate "overflow: hidden" in three.js or WebGL?
Description:
TOC: qna

# Question:

I'm currently working on a WebGL GUI for my games and I really want to dig deep into GPU graphics, since it's a lot smoother than WebKit CSS rendering.

Is it possible to make a scrollview where the inside meshes are following overflow rule to hide when going outside the boundaries of the parent mesh?

Perhaps a shader could work, any suggestions?

Thanks!

# Answer

If you only want to clip by rectangles you can use the scissor test.

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, width, height);

Now WebGL will only render between x, y, width, and height.

THREE.js also has scissor settings [`WebGLRenderer.setScissor`](https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderer.setScissor) and [`WebGLRenderer.setScissorTest`](https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderer.setScissorTest)
