Title: copyTexImage2D — GL ERROR :GL_INVALID_OPERATION : glCopyTexImage2D:
Description:
TOC: qna

# Question:

I’m trying to figure out how to use [gl.copyTexImage2D](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexImage2D) function.
I have the following code (unwieldy though):

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

//--------- SETUP (not important) ---------------

//I use budo package to easily run browserify
var createContext = require('webgl-context');
var createShader = require('gl-shader');

//↓ here is webgl setup usual routine, using floats and simple one-triangle vertex shader
var gl = createContext({width: 2, height: 2});
gl.getExtension('OES_texture_float');
gl.getExtension('OES_texture_float_linear');

var shader = createShader(gl, `
 precision mediump float;
 attribute vec2 position;
 varying vec2 uv;
 void main (void) {
  gl_Position = vec4(position, 0, 1);
  uv = vec2(position.x * 0.5 + 0.5, position.y * 0.5 + 0.5);
 }
`, `
 precision mediump float;
 uniform sampler2D image;
 varying vec2 uv;
 void main (void) {
  gl_FragColor = texture2D(image, uv);
 }
`);

//fullscreen triangle
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 3, 3, -1]), gl.STATIC_DRAW);
shader.attributes.position.pointer();

//textures
var outTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, outTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, new Float32Array([1,1,1,1, 0,0,0,1, 0,0,0,1, 0,0,0,1]));

var sourceTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, new Float32Array([0,0,0,1, 1,1,1,1, 0,0,0,1, 0,0,0,1]));


//--------------- MAIN PART (important) ---------------

//then I setup custom framebuffer ↓
var framebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture, 0);

gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
gl.drawArrays(gl.TRIANGLES, 0, 3);

//here ↓ I am expecting to copy framebuffer’s output, which is `outTexture`, to `sourceTexture`
gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, w, h, 0);

//then I try to render shader again, with it’s own output as input
gl.drawArrays(gl.TRIANGLES, 0, 3);

//when I try to read pixels here ↓ I get the error below
gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, pixels);
<!-- end snippet -->

The error: `[.CommandBufferContext]GL ERROR :GL_INVALID_OPERATION : glCopyTexImage2D:`

Cannot figure out what do I do wrong.


# Answer

The error is from `gl.copyTexImage2D` not from `gl.readPixels`. The reason you don't see it until calling `gl.readPixels` is because WebGL is a command driven language. Commands are not executed until they have to be for various reasons. `gl.flush` will force the commands to be executed at some point. `gl.readPixels` also forces the commands to be executed since the results of the commands needed to be used to read the pixels.

As for the error you need to provide more code. The code as is works through `gl.copyTexImage2D` which means the error you're getting from that has to do with some code your not showing. Either you created your textures wrong or w and h or funky values or something

Trying it out myself below it works but pointed out another error. You can't read floats with `gl.readPixels` in WebGL. Switching to `UNSIGNED_BYTE` works

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var gl = document.getElementById("c").getContext("webgl");
    var w = 300;
    var h = 150;

    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
    gl.useProgram(programInfo.program);

    var arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // make a renderable npot texture
    function createRenderableTexture(gl, w, h) {
     var tex = gl.createTexture();
     gl.bindTexture(gl.TEXTURE_2D, tex);
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     return tex;
    }

    var outTexture = createRenderableTexture(gl, w, h);
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture, 0);

    // render something to it
    gl.clearColor(0,1,0,1);  // green
    gl.clear(gl.COLOR_BUFFER_BIT);

    // copy the framebuffer to the texture
    var sourceTexture = createRenderableTexture(gl, w, h)
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, w, h, 0);

    // draw to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // clear to red
    gl.clearColor(1,0,0,1); 
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Since we cleared to red and the texture is filled with green
    // the result should be green
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    var pixels = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    log("pixel 0: " 
            + pixels[0] + "," 
            + pixels[1] + "," 
            + pixels[2] + "," 
            + pixels[3]);

    function log(msg) {
      var div = document.createElement("pre");
      div.appendChild(document.createTextNode(msg));
      document.body.appendChild(div);
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <script id="vs" type="notjs">
    attribute vec4 position;
    varying vec2 v_uv;

    void main() {
      gl_Position = position;
      v_uv = position.xy * 0.5 + 0.5;  
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_uv;
    uniform sampler2D u_texture;

    void main() {
      gl_FragColor = texture2D(u_texture, v_uv);
    }
      </script>
    <canvas id="c"></canvas>

<!-- end snippet -->

On the other hand `FLOAT` textures should not work. They worked for me but as far as I can tell that's a bug on my system not yours.

Specifically `FLOAT` textures are not allowed by default in WebGL. You can turn them on by enabling the `OES_texture_float` extension but [that extension specifically says](https://www.khronos.org/registry/gles/extensions/OES/OES_texture_float.txt)

> 3.  Should CopyTexImage2D, CopyTexSubImage{2D|3D} be supported for textures with half-float and float channels?
        
>     RESOLUTION: No.

[I filed a bug for Chrome](https://bugs.chromium.org/p/chromium/issues/detail?id=602570)

You can try to work around that issue by implementing `copyTexImage2D` yourself. Basically attach the texture you want to copy as a source texture to some shader and quad. Attach the texture you want to copy to to a framebuffer object. Since it's a `FLOAT` texture you need to call `checkFramebufferStatus` and check it returns `FRAMEBUFFER_COMPLETE` to make sure your GPU/Driver actually supports floating point textures as attachments. Then draw your quad with a simple shader effectively copying your texture from src to dst.


