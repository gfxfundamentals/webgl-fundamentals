Title: How to transform texture of three.js to WebGL
Description:
TOC: qna

# Question:

I got two texture objects of position and normal, say, 

    var tx1 = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
    var tx2 = gpuCompute.getCurrentRenderTarget( normalVariable ).texture;

which is calculated by `GPUComputationRenderer` from `three.js` (refer to the example `gpgpu/protoplanet` (1))

I want to transform it to a `WebGLBuffer` object for rendering, like:

    gl.bindBuffer(gl.ARRAY_BUFFER, tx1);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, tx2);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

But the direct assignment is not OK. 

I want to ask if there is a way to do it. The snapshot of the format of these two objects is shown as follows (tx1 is from threejs, and tx3 is from WebGL). Thanks.

(1) https://threejs.org/examples/#webgl_gpgpu_protoplanet

[![enter image description here][1]][1]


  [1]: https://i.stack.imgur.com/naqa1.png

# Answer

You can't copy textures into buffers directly. Why not just use them as textures? Here's an example that renders positions out of a texture.

https://stackoverflow.com/a/22009385/128511
