Title: What's minimum required code to MODIFY a WebGL shader at runtime?
Description:
TOC: qna

# Question:

Suppose I have created a WebGL program, attached some initial shaders, linked the program, validated and after some time I want to modify source of one of the attached shaders. 

Should I create a new WebGL program with the `gl.createProgram()`, or I can just reuse it and attach shaders?

I'm a bit confused about this because there are a few methods to call:

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.linkProgram(program);
    gl.validateProgram(program);

Which of these are required for just modifying one of the shaders in a program? I assume linking is required. Do I need to create new shader instance or I can reuse the instance and use `gl.shaderSource()` to pass in new source? Do I need to attach new/old shader to the program. Should I detach old shader from the program?

# Answer

You don't need to create new shaders. You do need to call `gl.shaderSource` to upload the new GLSL and then `gl.compileShader` and `gl.linkShader`.

This is a complicated part of the spec though. What are you trying to do?

If the link fails your program the program is no longer useable. If the link succeeds then you effectively have a new program and need to look up all new attribute and uniform locations.

You can create new shaders if you want and attach them to an existing program. Before you attach the new shaders you need to detach the old ones with `gl.detachShader(prg, oldShader)`

not sure this is helpful but you can think of internal `WebGLProgram` state like this

```
class WebGLProgram {
   Shader vertexShader;
   Shader fragmentShader;

   // status from last time you called gl.linkProgram
   int linkStatus;

   // message from last time you called gl.linkProgram  
   string infoLog;

   // internal program created by last SUCCESSFUL linkProgram
   Program validProgram; 
}

class Program {
  map<string, int> attribLocations;
  map<string, WebGLUniformLocation> uniformLocations;
  GPUProgramCode compiledProgram
}

class Shader {
  string src;

  // status from last time you called gl.compileShader
  int compileStatus;

  // message from last time you called gl.compileShader  
  string infoLog;

  // internal shader created from last successful compile
  GPUShaderCode compiledShader;
}
```

The only thing that matters when rendering is that `validProgram` on the `WebGLProgram` has a valid program. So for example

    const prg = gl.createProgram();
    gl.attachShader(prg, validCompiledVertexShader);
    gl.attachShader(prg, validCompiledFragmentShader);
    gl.linkProgram(prg);   

    // our imaginary prg.validProgram now has a valid program

    gl.detachShader(prg, validCompiledVertexShader);
    gl.detachShader(prg, validCompiledFragmentShader);
    gl.deleteShader(validCompiledVertexShader);
    gl.deleteShader(validCompiledFragmentShader);

Is a perfectly valid way to use shaders. They only need to stick around long enough to call `linkProgram`.
