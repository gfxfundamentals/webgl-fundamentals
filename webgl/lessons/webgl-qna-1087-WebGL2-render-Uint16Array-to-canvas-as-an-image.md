Title: WebGL2 render Uint16Array to canvas as an image
Description:
TOC: qna

# Question:

I am attempting to render a `Uint16Array` to an image in the browser using webgl2 textures.  I have a working example fiddle of a `Uint8Array` and am struggling with the upgrade to 16bit as webgl has a steep learning curve.

**Working 8-bit fiddle (identical to snippet below):** `Uint8Array` http://jsfiddle.net/njxvftc9/2/ 
**Non-working 16-bit attempt:** `Uint16Array` http://jsfiddle.net/njxvftc9/3/ 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->


    // image data
    var w = 128;
    var h = 128;
    var size = w * h * 4;
    var img = new Uint8Array(size); // need Uint16Array
    for (var i = 0; i < img.length; i += 4) {
        img[i + 0] = 255; // r
        img[i + 1] = i/64; // g
        img[i + 2] = 0; // b
        img[i + 3] = 255; // a
    }

    // program
    var canvas = document.getElementById('cv');
    var gl = canvas.getContext('webgl2');

    var program = gl.createProgram();
    //var color_buffer_float_16ui = gl.getExtension('EXT_color_buffer_float'); // add for 16-bit

    // texture
    var tex = gl.createTexture(); // create empty texture
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
        gl.TEXTURE_2D, // target
        0, // mip level
        gl.RGBA, // internal format -> gl.RGBA16UI
        w, h, // width and height
        0, // border
        gl.RGBA, //format -> gm.RGBA_INTEGER
        gl.UNSIGNED_BYTE, // type -> gl.UNSIGNED_SHORT
        img // texture data
    );

    // buffer
    var buffer = gl.createBuffer();
    var bufferData =  new Float32Array([
        -1, -1,
        1, -1,
        1, 1,               
        1, 1,
        -1, 1,
        -1, -1
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

    // shaders
    program.vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(program.vs,
                    "attribute vec4 vertex;\n" + // incoming pixel input?
                    "varying vec2 pixelCoordinate;\n" + // variable used to pass position to fragment shader
                    "void main(){\n" +
                    " gl_Position = vertex;\n" + // set pixel output position to incoming position (pass through)
                    " pixelCoordinate = vertex.xy*0.5+0.5;\n" + // set coordinate for fragment shader
                    "}\n");

    program.fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(program.fs,
                    "precision highp float;\n" + // ?
                    "uniform sampler2D tex;\n" + // ?
                    "varying vec2 pixelCoordinate;\n" + // receive pixel position from vertex shader
                    "void main(){\n" +
                    " gl_FragColor = texture2D(tex, pixelCoordinate);\n" + // lookup color in texture image at coordinate position and set color to
                    "}\n");

    gl.compileShader(program.vs);
    gl.compileShader(program.fs);

    gl.attachShader(program,program.vs);
    gl.attachShader(program,program.fs);

    gl.deleteShader(program.vs);
    gl.deleteShader(program.fs);

    // program
    gl.bindAttribLocation(program, 0, "vertex");
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6); // execute program


<!-- language: lang-html -->

    <canvas id="cv" width="100" height="100"></canvas>

<!-- end snippet -->

I have tried made many other techniques, referenced the spec, tried converting to floating point in the shaders, and have tried to combine methods seen here: https://stackoverflow.com/questions/51101023/render-to-16bits-unsigned-integer-2d-texture-in-webgl2 with no success.

I prefer vanilla js but am open to using libraries such as twgl or three.js as long as the input is a `Uint16Array`, the shaders can output any format (float, etc).

Can anyone with more experience in webgl2 point me in the right direction or provide a working sample fiddle here?  Is there a simple mistake in my code, am I missing a larger concept, is this even possible?  Any help is greatly appreciated!

# Answer

If you want to put 16bit data into a texture you need to choose a 16bit texture internal format. Looking at [the list of internal formats](https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html) your choices for RGBA are

```
gl.RGBA16I    // 16bit integers
gl.RGBA16UI   // 16bit unsigned integers
gl.RGBA16F    // 16bit half floats
```

It looks like you choose `gl.RGBA16UI`

To access that texture in the shader this line

```
uniform sampler2D tex;
```

has to change this this

```
uniform usampler2D tex;
```

That syntax is only available with GLSL 3.00 es so you need to add `#version 300 es` to the top of both shaders.

Switching to `#version 300 es` also means [other syntax changes](https://webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html). `attribute` becomes `in`, `varying` becomes `out` in a vertex shader and `in` in a fragment shader. `gl_FragColor` disappears and you have to declare your own output for example `out vec4 fooColor;`. Also `texture2D` becomes just `texture`

You can not using filtering on integer textures so these 2 lines

```
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
```

need to change to 

```
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

And when you get data out of the texture it will be unsigned integers so this line

```
gl_FragColor = texture2D(tex, pixelCoordinate);
```

would end up changing to something like

```
out vec4 fooColor;  // named this fooColor to make it clear you pick the name

void main() {
  uvec4 unsignedIntValues = texture(tex, pixelCoordinate);
  vec4 floatValues0To65535 = vec4(unsignedIntValues);  
  vec4 colorValues0To1 = floatValues0To65535 / 65535.0;
  fooColor = colorValues0To1;
}
```

Of course you can shorten that math to a single line

```
  fooColor = vec4(texture(tex, pixelCoordinate)) / 65535.0;
```

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // image data
    var w = 128;
    var h = 128;
    var size = w * h * 4;
    var img = new Uint16Array(size); // need Uint16Array
    for (var i = 0; i < img.length; i += 4) {
        img[i + 0] = 65535; // r
        img[i + 1] = i/64 * 256; // g
        img[i + 2] = 0; // b
        img[i + 3] = 65535; // a
    }

    // program
    var canvas = document.getElementById('cv');
    var gl = canvas.getContext('webgl2');

    var program = gl.createProgram();
    //var color_buffer_float_16ui = gl.getExtension('EXT_color_buffer_float'); // add for 16-bit

    // texture
    var tex = gl.createTexture(); // create empty texture
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
        gl.TEXTURE_2D, // target
        0, // mip level
        gl.RGBA16UI, // internal format -> gl.RGBA16UI
        w, h, // width and height
        0, // border
        gl.RGBA_INTEGER, //format -> gm.RGBA_INTEGER
        gl.UNSIGNED_SHORT, // type -> gl.UNSIGNED_SHORT
        img // texture data
    );

    // buffer
    var buffer = gl.createBuffer();
    var bufferData =  new Float32Array([
        -1, -1,
        1, -1,
        1, 1,               
        1, 1,
        -1, 1,
        -1, -1
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

    // shaders
    program.vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(program.vs, `#version 300 es
      in vec4 vertex; // incoming pixel input?
      out vec2 pixelCoordinate; // variable used to pass position to fragment shader
      void main(){
         gl_Position = vertex;  // set pixel output position to incoming position (pass through)
         pixelCoordinate = vertex.xy*0.5+0.5; // set coordinate for fragment shader
      }
    `);

    program.fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(program.fs, `#version 300 es
      precision highp float; // ?
      uniform highp usampler2D tex; // ?
      in vec2 pixelCoordinate; // receive pixel position from vertex shader
      out vec4 fooColor;
      void main() {
         uvec4 unsignedIntValues = texture(tex, pixelCoordinate);
         vec4 floatValues0To65535 = vec4(unsignedIntValues);
         vec4 colorValues0To1 = floatValues0To65535 / 65535.0;
         fooColor = colorValues0To1;
      }
    `);

    gl.compileShader(program.vs);
    checkCompileError(program.vs);
    gl.compileShader(program.fs);
    checkCompileError(program.fs);

    function checkCompileError(s) {
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
       console.error(gl.getShaderInfoLog(s));
      }
    }

    gl.attachShader(program,program.vs);
    gl.attachShader(program,program.fs);

    gl.deleteShader(program.vs);
    gl.deleteShader(program.fs);

    // program
    gl.bindAttribLocation(program, 0, "vertex");
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6); // execute program

<!-- language: lang-html -->

    <canvas id="cv" width="100" height="100"></canvas>

<!-- end snippet -->


