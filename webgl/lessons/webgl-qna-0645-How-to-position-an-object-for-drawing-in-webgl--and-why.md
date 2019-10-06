Title: How to position an object for drawing in webgl? and why
Description:
TOC: qna

# Question:

I've managed to make a webgl example all in one file with no included libraries, and only functions that are being used: https://jsfiddle.net/vmLab6jr/

I'm drawing a square made of 2 triangles and I'm making it move farther away and closer to the camera. I want to understand how this part works:

 // Now move the drawing position a bit to where we want to start
 // drawing the square.
 mvMatrix = [
  [1,0,0,0],
  [0,1,0,0],
  [0,0,1,-12+Math.sin(g.loops/6)*4],
  [0,0,0,1]
 ];
 
 var mvUniform = gl.getUniformLocation(g.shaderProgram, "uMVMatrix");
 gl.uniformMatrix4fv(mvUniform, false, g.float32(mvMatrix));

Why does webgl want a 4x4 matrix to set the position for drawing an object? Or is there a way to use 1x3, like [x,y,z]? Is it because the shaders I'm using we're arbitrarily set to 4x4?
I cannot find information on what uniformMatrix4fv() does and when and why it's used and what the alternatives are.
Why does the element [2][3] control the z of the object?

I know it has something to do with the frustum matrix being 4x4. And that same spot in the frustum matrix has D, where var D = -2*zfar*znear/(zfar-znear); But to change the x of the object I'm drawing I need to change [0][3] but that slot in the frustum matrix just has a 0.


    function makeFrustum(left, right, bottom, top, znear, zfar)
    {
     var X = 2*znear/(right-left);
     var Y = 2*znear/(top-bottom);
     var A = (right+left)/(right-left);
     var B = (top+bottom)/(top-bottom);
     var C = -(zfar+znear)/(zfar-znear);
     var D = -2*zfar*znear/(zfar-znear);
    
     return [
      [X, 0, A, 0],
      [0, Y, B, 0],
      [0, 0, C, D],
      [0, 0, -1, 0]
     ];
    }

I've been using this tutorial: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL



# Answer

WebGL does not want a 4x4 matrix. [WebGL is just a rasterization library](http://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html)

All it cares about is you provide a vertex shader that fills in a special variable called `gl_Position` with a clip space coordinate and then you also provide a fragment shader that sets the special variable `gl_FragColor` with a color.

No matrices are required to do that. Any matrices you use are yours, provided by you to code you supply. There are no required matrices in WebGL.

That said if you follow [these tutorials](http://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html) they will eventually lead you to how to use matrices and [how the frustum function works](http://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html)

There's also this Q&A: https://stackoverflow.com/questions/28286057/trying-to-understand-the-math-behind-the-perspective-matrix-in-webgl/28301213

As for your multiple questions

> Why does webgl want a 4x4 matrix to set the position for drawing an object?

It doesn't. The shader *you provided* does.

> Or is there a way to use 1x3, like [x,y,z]? 

Yes, provide a shader that uses 1x3 math

> Is it because the shaders I'm using we're arbitrarily set to 4x4? 

Yes

> I cannot find information on what uniformMatrix4fv() does and when and why it's used and what the alternatives are. 

WebGL 1.0 is based on OpenGL ES 2.0 and so [the WebGL spec](https://www.khronos.org/registry/webgl/specs/latest/1.0/) basically says "look at the [OpenGL ES 2.0 spec](https://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf)". Specifically it says

> ### 1.1 Conventions

> ...

> The remaining sections of this document are intended to be read in conjunction with the OpenGL ES 2.0 specification (2.0.25 at the time of this writing, available from the Khronos OpenGL ES API Registry). Unless otherwise specified, the behavior of each method is defined by the OpenGL ES 2.0 specification.

As for uniformMatrix4fv the various [`uniform` functions](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glUniform.xml) are used to set global variables you declared inside the shaders you provided. These global variables are called `uniforms` because they keep a uniform value from iteration to iteration of your shaders. That's in contrast to 2 other kinds of shader inputs. One called `attributes` which *generally* pull the next set of values out of buffers during each iteration of your vertex shader. The other type are called `varyings` which you set in your vertex shader and are [interpolated for each iteration of your fragment shader](http://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html).

