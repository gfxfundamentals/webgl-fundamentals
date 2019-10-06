Title: webGL gl.uniformMatrix4v function
Description:
TOC: qna

# Question:

I'm following a tutorial,although there are resources but still I'm not sure as to why we use *uniformMatrix4v* function.Here's the code snippet.

```
var matWorldMatrixLocation = gl.getUniformLocation(program,'mWorld');
    var matViewMatrixLocation = gl.getUniformLocation(program,'mView');
    var matProjMatrixLocation = gl.getUniformLocation(program,'mProj');

    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);

    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix,[0, 0, -5], [0, 0, 0], [0, 1, 0]);
 mat4.perspective(projMatrix,glMatrix.toRadian(45), canvas.width / canvas.clientHeight, 1e-4, 1e4);

 //send matrices to shader
 gl.uniformMatrix4fv(matWorldMatrixLocation, false, worldMatrix);
    gl.uniformMatrix4fv(matViewMatrixLocation, false, viewMatrix);
    gl.uniformMatrix4fv(matProjMatrixLocation, false, projMatrix)
```

# Answer

The comment says exactly why gl.uniformMatrix4v is used `// send matrices to shader`. 

If you don't understand what uniforms are then you need to [read some more tutorials on WebGL](https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html). If you don't understand what matrices are then you need to [read some articles on matrices](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html)

The short version is when using WebGL you run small programs called "shaders" on the GPU. Before you run the shaders you need to set up their inputs. To do that you need to lookup the locations of those inputs with `gl.getUniformLocation` or `gl.getAttribLocation` depending on the type of input.

For uniforms you then call one of the many forms of `gl.uniform???` depending on the type of the uniform.

As for the code above creating 3 arrays first and then calling the `mat4` functions that's got absolutely nothing do with WebGL. That's the way some JavaScript math wants you to use it to generate matrices. I'm guessing that math library is [this one](http://glmatrix.net/).

It wants you to first create arrays which you can either do manually like the code above or you can call `mat4.create`. You then pass those to its functions as the first argument. This will fill out the values of the array with whatever values those functions are supposed to compute. Those arrays are then passed to the `gl.uniformMatrix4v` function to set the uniforms in the shader.

If you follow the links above they'll go through making your own 3D math functions so you can see what they do and how they work.

