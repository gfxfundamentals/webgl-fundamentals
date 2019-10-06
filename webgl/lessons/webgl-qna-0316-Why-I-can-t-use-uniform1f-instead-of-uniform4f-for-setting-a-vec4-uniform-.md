Title: Why I can't use uniform1f instead of uniform4f for setting a vec4 uniform?
Description:
TOC: qna

# Question:

I learn WebGL step by step via [this book][1]. I try to draw three points through using of the buffer (`gl.ARRAY_BUFFER`) instead of cycle (as I did the same earlier in other samples of the book). 

      var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
      if(!u_FragColor){
        console.log('Can\'t to get the "u_FragColor" variable.');
        return -1;
      }
    
      // gl.uniform1f(u_FragColor, 1.0); // <- this variant doesn't work! Why?
      gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);

It works fine, but I have a question about the `gl_FragColor` initializing: why I can't replace the

    gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);

on the

    gl.uniform1f(u_FragColor, 1.0);

? I expected this is the same. But this case I get the error in the console:

![enter image description here][2]


  [1]: https://sites.google.com/site/webglbook/
  [2]: http://i.stack.imgur.com/nuVrA.png

# Answer

You have to use the correct type to set a uniform. If your uniform is `vec4` then you have to use either `gl.uniform4f` or `gl.uniform4fv`. 

    uniform       valid
    type          functions
    ----------------------------------------------
    float         gl.uniform1f    gl.uniform1fv
    vec2          gl.uniform2f    gl.uniform2fv
    vec3          gl.uniform3f    gl.uniform3fv
    vec4          gl.uniform4f    gl.uniform4fv
    int           gl.uniform1i    gl.uniform1iv
    ivec2         gl.uniform2i    gl.uniform2iv
    ivec3         gl.uniform3i    gl.uniform3iv
    ivec4         gl.uniform4i    gl.uniform4iv
    sampler2D     gl.uniform1i    gl.uniform1iv
    samplerCube   gl.uniform1i    gl.uniform1iv

    mat2          gl.uniformMatrix2fv
    mat3          gl.uniformMatrix3fv
    mat4          gl.uniformMatrix4fv

    bool          gl.uniform1i gl.uniform1f gl.uniform1iv gl.uniform1fv
    bvec2         gl.uniform2i gl.uniform2f gl.uniform2iv gl.uniform2fv
    bvec3         gl.uniform3i gl.uniform3f gl.uniform3iv gl.uniform3fv
    bvec4         gl.uniform4i gl.uniform4f gl.uniform4iv gl.uniform4fv

[From the OpenGL ES 2.0 spec](https://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf) section 2.10.4 

> The Uniform* command used must match the size of the uniform, as declared in the shader. For example, to load a uniform declared as a bvec2, either Uniform2i{v} or Uniform2f{v} can be used. An INVALID_OPERATION error will be generated if an attempt is made to use a non-matching Uniform* command. In this example using Uniform1iv would generate an error

> For all other uniform types the Uniform* command used must match the size and type of the uniform, as declared in the shader. No type conversions are done. For example, to load a uniform declared as a vec4, Uniform4f{v} must be used. To load a 3x3 matrix, UniformMatrix3fv must be used. An INVALID_OPERATION error will be generated if an attempt is made to use a non-matching Uniform* command. In this example, using Uniform4i{v} would generate an error
