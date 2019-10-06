Title: Could not initialise shaders after properly compiled
Description:
TOC: qna

# Question:

Can anyone please help me on this?
    
After successfully compiled shaders still the link status is false.

Nothing showing in the console when I add `gl.getShaderInfoLog(fragmentShader)`.
    
    if (type == 'x-fragment') {
    str = "#ifdef GL_ES\n" +
    "precision highp float;\n" +
    "#endif\n" +
    "varying vec2 vTextureCoord;\n" +
    "uniform sampler2D uSampler;\n" +
    "uniform int uDrawColourMap;\n" +
    "uniform int hasTexture;\n" +
    "uniform vec4 uColourMapColour;\n" +
    "varying vec4 vColourAttribute;\n" +
    "void main(void) {\n" +
    "if (uDrawColourMap == 1) {\n" +
    "  gl_FragColor = uColourMapColour;\n" +
    "  return;\n" +
    "}\n" +
    "if (hasTexture == 1) {\n" +
    "    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n" +
    "}\n" +
    " else {\n" +
    " gl_FragColor = vColourAttribute;\n" +
    "}\n" +
    "}\n";
    shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == 'x-vertex') {
    str = "attribute vec3 aVertexPosition;\n" +
    "attribute vec2 aTextureCoord;\n" +
    "attribute vec4 aColourAttribute;\n" +
    "uniform mat4 uMVMatrix;\n" +
    "uniform int hasTexture;\n" +
    "uniform mat4 uPMatrix;\n" +
    "varying vec4 vColourAttribute;\n" +
    "varying vec2 vTextureCoord;\n" +
    "void main(void) {\n" +
    "    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
    " if (hasTexture == 1) {\n"+
    " vTextureCoord = aTextureCoord;\n"+
    "}\n"+
    " else {\n"+
    "vColourAttribute = aColourAttribute;\n"+
    "}\n"+
    "}\n";
    shader = gl.createShader(gl.VERTEX_SHADER);
    } 

# Answer

You need to call `gl.shaderSource(shader, source)` to upload your GLSL source. You then need to call `gl.compileShader(shader)` to compile the shader. After that you can call `gl.getShaderParameter(shader, gl.COMPILE_SHADER)` to check if it was successful or not. Also after compiling the shader you can call `gl.getShaderInfoLog(shader)` to get any messages from the GPU driver/browser.

NOTE: according to the OpenGL spec shaders are allowed to always claim to successfully compile as long as they still fail to link if they are invalid.

That means you should always also link the shaders into a program and check the program's `LINK_STATUS` and program info log

    var program = gl.createProgram();
    gl.attachShader(program, vShaderInfo.shader);
    gl.attachShader(program, fShaderInfo.shader);
    gl.linkProgram(program);
    console.log("link success:", gl.getProgramParameter(program, gl.LINK_STATUS));  
    console.log("log:", gl.getProgramInfoLog(program));

You need to call `gl.getProgramInfoLog` **not** ` gl.getShaderInfoLog` to get errors from linking.

Run to see the error

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.createElement("canvas").getContext("webgl");

    function makeShader(type) {
    if (type == 'x-fragment') {
    str = "#ifdef GL_ES\n" +
    "precision highp float;\n" +
    "#endif\n" +
    "varying vec2 vTextureCoord;\n" +
    "uniform sampler2D uSampler;\n" +
    "uniform int uDrawColourMap;\n" +
    "uniform int hasTexture;\n" +
    "uniform vec4 uColourMapColour;\n" +
    "varying vec4 vColourAttribute;\n" +
    "void main(void) {\n" +
    "if (uDrawColourMap == 1) {\n" +
    "  gl_FragColor = uColourMapColour;\n" +
    "  return;\n" +
    "}\n" +
    "if (hasTexture == 1) {\n" +
    "    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n" +
    "}\n" +
    " else {\n" +
    " gl_FragColor = vColourAttribute;\n" +
    "}\n" +
    "}\n";
    shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == 'x-vertex') {
    str = "attribute vec3 aVertexPosition;\n" +
    "attribute vec2 aTextureCoord;\n" +
    "attribute vec4 aColourAttribute;\n" +
    "uniform mat4 uMVMatrix;\n" +
    "uniform int hasTexture;\n" +
    "uniform mat4 uPMatrix;\n" +
    "varying vec4 vColourAttribute;\n" +
    "varying vec2 vTextureCoord;\n" +
    "void main(void) {\n" +
    "    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
    " if (hasTexture == 1) {\n"+
    " vTextureCoord = aTextureCoord;\n"+
    "}\n"+
    " else {\n"+
    "vColourAttribute = aColourAttribute;\n"+
    "}\n"+
    "}\n";
    shader = gl.createShader(gl.VERTEX_SHADER);
    } 
    return { shader: shader, src: str };
    };

    function compileShader(shaderInfo) {
     var shader = shaderInfo.shader;
     var src = shaderInfo.src;
      
     gl.shaderSource(shader, src);
     gl.compileShader(shader);
     console.log("compile success:", gl.getShaderParameter(shader, gl.COMPILE_STATUS));  
     console.log("log:", gl.getShaderInfoLog(shader));
    }

    var vShaderInfo = makeShader('x-fragment');
    var fShaderInfo = makeShader('x-vertex');
    compileShader(vShaderInfo);
    compileShader(fShaderInfo);

    var program = gl.createProgram();
    gl.attachShader(program, vShaderInfo.shader);
    gl.attachShader(program, fShaderInfo.shader);
    gl.linkProgram(program);
    console.log("link success:", gl.getProgramParameter(program, gl.LINK_STATUS));  
    console.log("log:", gl.getProgramInfoLog(program));

<!-- end snippet -->

The error from the above program says your uniform precision for `hasTexture` does not match from vertex shader to fragment shader. The default for `int` is `highp` in vertex shaders and `mediump` in fragment shaders so change one or the other. Either put

    uniform mediump int hasTexture;

In your vertex shader or

    uniform highp int hasTexture;

In your fragment shader

or change to a bool.

---

**note**: I feel compelled to point out using flags to select features in a shader is an anti-pattern. You should consider using different shaders instead if flags in one shader (best) or you should at least remove the flags and design the shader so you can pass in white.

Example:

    gl_FragColor = uColourMapColour * 
                   texture2D(uSampler, vTextureCoord) *
                   vColourAttribute;

To draw with a solid color

* set `uColourMapColour` to your desired color
* turn off the attribute for `vColourAttribute` with `gl.disableVertexAttribArray(vColourAttribLocation)` and then set it to 1 with `gl.vertexAttrib4fv(vColourAttribLocation, [1, 1, 1, 1])`;
* set `uSampler` to a 1x1 pixels white texture

To draw with vertex colors

* set `uColourMapColour` to [1, 1, 1, 1])
* turn on the attribute for `vColourAttribute` with `gl.enableVertexAttribArray(vColourAttribLocation)` and point it to some data (`gl.bindBuffer`, `gl.vertexAttribPointer`);
* set `uSampler` to a 1x1 pixels white texture

To draw with a texture

* set `uColourMapColour` to [1, 1, 1, 1])
* turn off the attribute for `vColourAttribute` with `gl.disableVertexAttribArray(vColourAttribLocation)` and then set it to 1 with `gl.vertexAttrib4fv(vColourAttribLocation, [1, 1, 1, 1])`;
* set `uSampler` to your texture

This also lets you combine things like drawing your texture tinted by setting both a texture and uColourMapColour as well as blend vertex colors and textures colors, etc.



