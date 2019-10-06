Title: When should I enable/disable vertex position attributes in WebGL/OpenGL?
Description:
TOC: qna

# Question:

I'm working on some WebGL code that has multiple shader programs that run sequentially.

Previously, I was using `gl.enableVertexAttribArray(...)` as required during initialization for my gl context and shaders. I assumed, perhaps incorrectly, that calling this function was setting state specific to the program selected by `gl.useProgram(...)`

Now, my first shader program has two enabled attribute arrays, and my second one has one enabled. When the second program runs, I get an error:

    Error: WebGL: drawArrays: no VBO bound to enabled vertex attrib index 1!

So that leads me to think that maybe I need to be disabling vertex attribute 1 after using it in the first program, but I wanted to verify that this is how I'm supposed to be doing it, and hopefully get an explanation of why this is or isn't correct.

Is the best practice to `enableVertexAttribArray(...)` and `disableVertexAttribArray` for *every* array location before and after each use?

# Answer

I've never called `disableVertexAttribArray` in my life and I've written 100s of WebGL programs. There may or may not be any perf benefits to calling it but there's no compatibility issues to not calling it.

[The spec says](https://www.khronos.org/registry/webgl/specs/1.0/#6.5) you'll only get an error if the attribute is consumed by the current program and access would be out of range or if there's no buffer bound to an enabled attribute. 

We can test that and see that it works just fine. 

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var vsThatUses2Attributes = `
      attribute vec4 position;
      attribute vec2 texcoord;
      
      varying vec2 v_texcoord;
      
      void main() {
        v_texcoord = texcoord;
        gl_Position = position;
      }
    `;

    var vsThatUses1Attribute = `
      attribute vec4 position;
      
      varying vec2 v_texcoord;
      
      void main() {
        v_texcoord = position.xy * 0.5 + 0.5;
        gl_Position = position + vec4(1, 0, 0, 0);
      }
    `;

    var fs = `
      precision mediump float;
      varying vec2 v_texcoord;
      
      void main () {
        gl_FragColor = vec4(v_texcoord, v_texcoord.x * v_texcoord.y, 1);
      }
    `;

    var gl = document.querySelector("canvas").getContext("webgl");
    document.body.appendChild(gl.canvas);
    var programThatUses2Attributes = twgl.createProgramFromSources(gl, [vsThatUses2Attributes, fs]);
    var programThatUses1Attribute = twgl.createProgramFromSources(gl, [vsThatUses1Attribute, fs]);

    var positionLocation2AttribProg = gl.getAttribLocation(programThatUses2Attributes, "position");
    var texcoordLocation2AttribProg = gl.getAttribLocation(programThatUses2Attributes, "texcoord");

    var positionLocation1AttribProg = gl.getAttribLocation(programThatUses1Attribute, "position");

    var positionBufferFor2AttribPrg = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferFor2AttribPrg);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
     -.5,  1,
       0, -1,
    ]), gl.STATIC_DRAW);

    var texcoordBufferFor2AttribPrg = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBufferFor2AttribPrg);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
    0.5, 1,
      1, 0,
    ]), gl.STATIC_DRAW);


    var positionBufferFor1AttribPrg = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferFor1AttribPrg);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       0, -1,
      -1,  1,
      -1,  1,
       0, -1,
       0,  1,
    ]), gl.STATIC_DRAW);


    // turn on 2 attributes
    gl.enableVertexAttribArray(positionLocation2AttribProg);
    gl.enableVertexAttribArray(texcoordLocation2AttribProg);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferFor2AttribPrg);
    gl.vertexAttribPointer(positionLocation2AttribProg, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBufferFor2AttribPrg);
    gl.vertexAttribPointer(texcoordLocation2AttribProg, 2, gl.FLOAT, false, 0, 0);

    // draw with 2 attributes enabled
    gl.useProgram(programThatUses2Attributes);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // setup for second program that uses only 1 attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferFor1AttribPrg);
    gl.vertexAttribPointer(positionLocation1AttribProg, 2, gl.FLOAT, false, 0, 0);

    // NOTICE WE HAVE !NOT turned off other attribute
    gl.useProgram(programThatUses1Attribute);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    log("glError:", gl.getError());

    function log() {
      var pre = document.createElement("pre");
      pre.appendChild(document.createTextNode(Array.prototype.join.call(arguments, " ")));
      document.body.appendChild(pre);
    }





<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <pre>
    This example draws a triangle with 3 vertices using 2 attributes.

    It then draws a quad using 6 vertices and 1 attribute 
    <b>WITHOUT TURNING OFF THE NOW 2nd UNUSED ATTRIBUTE</b>.

    That means not only is that attribute left on but it only has 3 vertices even 
though the draw will use 6 vertices. Because that attribute is not 'comsumed' by 
the current program it's ok according to the spec.
    </pre>
    <canvas width="150" height="30"></canvas>

<!-- end snippet -->

So, your error is likely something else.

Note that deleting a buffer will unbind it from the attribute, at which point it will be an enabled attribute with no buffer and cause an error unless you disable it.

Attribute state is separate from program state which you found out.

Your error means exactly what it says. You tried to draw, that program required data on attribute #1. You enabled it at some point with `gl.enableVertexAttribArray` but you didn't give it any data with `gl.vertexAttribPointer`. So you got an error.

Note that `gl.vertexAttribPointer` binds the buffer currently bound to `gl.ARRAY_BUFFER` to the specified attribute.

You might find this answer useful

https://stackoverflow.com/a/27164577/128511
