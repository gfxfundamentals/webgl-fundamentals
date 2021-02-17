Title: How can I create a 16bit historgram of 16bit data
Description: How can I create a 16bit historgram of 16bit data
TOC: How can I create a 16bit historgram of 16bit data

## Question:



<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl, utils, pseudoImg, vertices;
    var img = null;
    document.addEventListener('DOMContentLoaded', () => {
        utils = new WebGLUtils();
        vertices = utils.prepareVec2({x1 : -1.0, y1 : -1.0, x2 : 1.0, y2 : 1.0});
        gl = utils.getGLContext(document.getElementById('canvas'));
        var program = utils.getProgram(gl, 'render-vs', 'render16bit-fs');
        var histogramProgram = utils.getProgram(gl, 'histogram-vs', 'histogram-fs');
        var sortProgram = utils.getProgram(gl, 'sorting-vs', 'sorting-fs');
        var showProgram = utils.getProgram(gl, 'showhistogram-vs', 'showhistogram-fs');
        utils.activateTextureByIndex(gl, showProgram, 'histTex', 3);
        utils.activateTextureByIndex(gl, showProgram, 'maxTex', 4);
        utils.activateTextureByIndex(gl, sortProgram, 'tex3', 2);
        utils.activateTextureByIndex(gl, histogramProgram, 'tex2', 1);
        utils.activateTextureByIndex(gl, program, 'u_texture', 0);
        
        var vertexBuffer = utils.createAndBindBuffer(gl, vertices);
        var imageTexture;
        computeHistogram = (AR, myFB) => {
            gl.useProgram(histogramProgram);
            var width = AR.width;
            var height = AR.height;
            var numOfPixels = width * height;
            var pixelIds = new Float32Array(numOfPixels);
            for (var i = 0; i < numOfPixels; i++) {
                pixelIds[i] = i;
            }
            var histogramFbObj = utils.createTextureAndFramebuffer(gl, {
                format : gl.RED,
                internalFormat : gl.R32F,
                filter : gl.NEAREST,
                dataType : gl.FLOAT,
                mipMapST : gl.CLAMP_TO_EDGE,
                width : 256,
                height : 256
            });
            gl.bindFramebuffer(gl.FRAMEBUFFER, histogramFbObj.fb);
            gl.viewport(0, 0, 256, 256);
            var pixelBuffer = utils.createAndBindBuffer(gl, pixelIds, true);
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.enable(gl.BLEND);
            utils.linkAndSendDataToGPU(gl, histogramProgram, 'pixelIds', pixelBuffer, 1);
            gl.uniform2fv(gl.getUniformLocation(histogramProgram, 'imageDimensions'), [width, height]);
            utils.sendTextureToGPU(gl, myFB.tex, 1);
            gl.drawArrays(gl.POINTS, 0, numOfPixels);

            gl.blendFunc(gl.ONE, gl.ZERO);
            gl.disable(gl.BLEND);
            return histogramFbObj;
        };

        sortHistogram = (histogramFbObj) => {
            gl.useProgram(sortProgram);
            utils.linkAndSendDataToGPU(gl, sortProgram, 'vertices', vertexBuffer, 2);
            var sortFbObj = utils.createTextureAndFramebuffer(gl, {
                format : gl.RED,
                internalFormat : gl.R32F,
                filter : gl.NEAREST,
                dataType : gl.FLOAT,
                mipMapST : gl.CLAMP_TO_EDGE,
                width : 1,
                height : 1
            });
            gl.bindFramebuffer(gl.FRAMEBUFFER, sortFbObj.fb);
            gl.viewport(0, 0, 1, 1);
            utils.sendTextureToGPU(gl, histogramFbObj.tex, 2);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            return sortFbObj;
        };

        showHistogram = (histFb, sortFb) => {
            gl.useProgram(showProgram);
            utils.linkAndSendDataToGPU(gl, showProgram, 'vertices', vertexBuffer, 2);
            utils.sendTextureToGPU(gl, histFb.tex, 3);
            utils.sendTextureToGPU(gl, sortFb.tex, 4);
            gl.uniform2fv(gl.getUniformLocation(showProgram, 'imageDimensions'), [gl.canvas.width, gl.canvas.height]);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        };

        showTexture = (AR) => {
            imageTexture = utils.createAndBindTexture(gl, {
                filter : gl.NEAREST,
                mipMapST : gl.CLAMP_TO_EDGE,
                dataType : gl.UNSIGNED_SHORT,
                format : gl.RGBA_INTEGER,
                internalFormat : gl.RGBA16UI,
                img : AR.img,
                width : AR.width,
                height : AR.height
            });

            gl.useProgram(program);
            var myFB = utils.createTextureAndFramebuffer(gl, {
                filter : gl.NEAREST,
                mipMapST : gl.CLAMP_TO_EDGE,
                dataType : gl.UNSIGNED_BYTE,
                format : gl.RGBA,
                internalFormat : gl.RGBA,
                width : AR.width,
                height : AR.height,
            });
            gl.bindFramebuffer(gl.FRAMEBUFFER, myFB.fb);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            utils.linkAndSendDataToGPU(gl, program, 'vertices', vertexBuffer, 2);
            gl.uniform1f(gl.getUniformLocation(program, 'flipY'), 1.0);
            utils.sendTextureToGPU(gl, imageTexture, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            var fb1 = computeHistogram(AR, myFB);
            var fb2 = sortHistogram(fb1);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            showHistogram(fb1, fb2);
        };

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
        showTexture({
            img : img,
            width : w,
            height : h
        });
    });





<!-- language: lang-html -->

    <script id="render16bit-fs" type="not-js">
                #version 300 es
                precision highp float; 
                uniform highp usampler2D tex;
                in vec2 texcoord; // receive pixel position from vertex shader
                out vec4 fooColor;
                void main() {
                    uvec4 unsignedIntValues = texture(tex, texcoord);
                    vec4 floatValues0To65535 = vec4(unsignedIntValues);
                    vec4 colorValues0To1 = floatValues0To65535;
                    fooColor = colorValues0To1;
                }          
            </script>

            <script type="not-js" id="render-vs">
                #version 300 es
                in vec2 vertices;
                out vec2 texcoord;
                uniform float flipY;
                void main() {
                    texcoord = vertices.xy * 0.5 + 0.5;
                    gl_Position = vec4(vertices.x, vertices.y * flipY, 0.0, 1.0);
                }
            </script>

            <script type="not-js" id="histogram-vs">
                #version 300 es
                in float pixelIds; //0,1,2,3,4,.......width*height
                uniform sampler2D tex2;
                uniform vec2 imageDimensions;
                void main () {
                    vec2 pixel = vec2(mod(pixelIds, imageDimensions.x), floor(pixelIds / imageDimensions.x)); 
                    vec2 xy = pixel/imageDimensions;
                    float pixelValue = texture(tex2, xy).r;//Pick Pixel value from GPU texture ranges from 0-65535
                    float xDim = mod(pixelValue, 255.0)/256.0;
                    float yDim = floor(pixelValue / 255.0)/256.0;
                    float xVertex = (xDim*2.0) - 1.0;//convert 0.0 to 1.0 -> -1.0 -> 1.0, it will increment because we have used gl.blendFunc
                    float yVertex = 1.0 - (yDim*2.0);
                    gl_Position = vec4(xVertex, yVertex, 0.0, 1.0);
                    gl_PointSize = 1.0;
                }
            </script>
            <script type="not-js" id="histogram-fs">
                #version 300 es
                precision mediump float;
                out vec4 fcolor;
                void main() {
                    fcolor = vec4(1.0, 1.0, 1.0, 1.0);
                }
            </script>

            <script type="not-js" id="sorting-vs">
                #version 300 es
                in vec2 vertices;
                void main () {
                    gl_Position = vec4(vertices, 0.0, 1.0);
                }
            </script>
            <script type="not-js" id="sorting-fs">
                #version 300 es
                precision mediump float;
                out vec4 fcolor;
                uniform sampler2D tex3;
                const int MAX_WIDTH = 65536;
                void main() {
                    vec4 maxColor = vec4(0.0);
                    for (int i = 0; i < MAX_WIDTH; i++) {
                        float xDim = mod(float(i), 256.0)/256.0;
                        float yDim = floor(float(i) / 256.0)/256.0;
                        vec2 xy = vec2(xDim, yDim);
                        vec4 currPixel = texture(tex3, xy).rrra;
                        maxColor = max(maxColor, currPixel);
                    }
                    fcolor = vec4(maxColor);
                }
            </script>

            <script type="not-js" id="showhistogram-vs">
                #version 300 es
                in vec2 vertices;
                void main () {
                    gl_Position = vec4(vertices, 0.0, 1.0);
                }
            </script>
            <script type="not-js" id="showhistogram-fs">
                #version 300 es
                precision mediump float;
                uniform sampler2D histTex, maxTex;
                uniform vec2 imageDimensions;
                out vec4 fcolor;
                void main () {
                    // get the max color constants
                    vec4 maxColor = texture(maxTex, vec2(0));
                    // compute our current UV position
                    vec2 uv = gl_FragCoord.xy / imageDimensions;
                    vec2 uv2 = gl_FragCoord.xy / vec2(256.0, 256.0);
                    // Get the history for this color
                    vec4 hist = texture(histTex, uv2);
                    // scale by maxColor so scaled goes from 0 to 1 with 1 = maxColor
                    vec4 scaled = hist / maxColor;
                    // 1 > maxColor, 0 otherwise
                    vec4 color = step(uv2.yyyy, scaled);
                    fcolor = vec4(color.rgb, 1);
                }
            </script>
            
            <canvas id="canvas"></canvas>
            <script type="text/javascript">
            class WebGLUtils {
        getGLContext = (canvas, version) => {
            canvas.width = window.innerWidth * 0.99;
            canvas.height = window.innerHeight * 0.85;
            var gl = canvas.getContext(version ? 'webgl' : 'webgl2');
            const ext = gl.getExtension("EXT_color_buffer_float");
            if (!ext) {
                console.log("sorry, can't render to floating point textures");
            }
            gl.clearColor(0, 0, 0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
            gl.lineWidth(0.5);
            return gl;
        };

        clear = (gl) => {
            gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        };

        getShader = (gl, type, shaderText) => {
            var vfs = gl.createShader(type);
            gl.shaderSource(vfs, shaderText);
            gl.compileShader(vfs);
            if (!gl.getShaderParameter(vfs, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(vfs));
            }
            return vfs;
        };

        getProgram = (gl, vertexShader, fragmentShader) => {
            var program = gl.createProgram();
            gl.attachShader(program, this.getShader(gl, gl.VERTEX_SHADER, document.getElementById(vertexShader).text.trim()));
            gl.attachShader(program, this.getShader(gl, gl.FRAGMENT_SHADER, document.getElementById(fragmentShader).text.trim()));
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error(gl.getProgramInfoLog(program));
            }
            return program;
        };

        createAndBindBuffer = (gl, relatedVertices, isNotJSArray) => {
            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, isNotJSArray ? relatedVertices : new Float32Array(relatedVertices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            return buffer;
        };

        createAndBindTexture = (gl, _) => {
            var texBuffer = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texBuffer);
            if (_.img.width) {
                gl.texImage2D(gl.TEXTURE_2D, 0, _.internalFormat, _.format, _.dataType, _.img);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, _.internalFormat, _.width, _.height, 0, _.format, _.dataType, _.img);
            }
            // set the filtering so we don't need mips
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, _.filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, _.filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, _.mipMapST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, _.mipMapST);
            gl.bindTexture(gl.TEXTURE_2D, null);
            return texBuffer;
        };

        createTextureAndFramebuffer = (gl, _) => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, _.internalFormat, _.width, _.height, 0, _.format, _.dataType, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, _.filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, _.filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, _.mipMapST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, _.mipMapST);
            const fb = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            console.log(`can ${status === gl.FRAMEBUFFER_COMPLETE ? "" : "NOT "}render to R32`);
            return {tex: tex, fb: fb};
        };

        linkAndSendDataToGPU = (gl, program, linkedVariable, buffer, dimensions) => {
            var vertices = gl.getAttribLocation(program, linkedVariable);
            gl.enableVertexAttribArray(vertices);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(vertices, dimensions, gl.FLOAT, gl.FALSE, 0, 0);
            return vertices;
        };

        sendDataToGPU = (gl, buffer, vertices, dimensions) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(vertices, dimensions, gl.FLOAT, gl.FALSE, 0, 0);
        };

        sendTextureToGPU = (gl, tex, index) => {
            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(gl.TEXTURE_2D, tex);
        };

        calculateAspectRatio = (img, gl) => {
            var cols = img.width;
            var rows = img.height; 
            var imageAspectRatio = cols / rows;
            var ele = gl.canvas;
            var windowWidth = ele.width;
            var windowHeight = ele.height;
            var canvasAspectRatio = windowWidth / windowHeight;
            var renderableHeight, renderableWidth;
            var xStart, yStart;
            /// If image's aspect ratio is less than canvas's we fit on height
            /// and place the image centrally along width
            if(imageAspectRatio < canvasAspectRatio) {
                renderableHeight = windowHeight;
                renderableWidth = cols * (renderableHeight / rows);
                xStart = (windowWidth - renderableWidth) / 2;
                yStart = 0;
            }
        
            /// If image's aspect ratio is greater than canvas's we fit on width
            /// and place the image centrally along height
            else if(imageAspectRatio > canvasAspectRatio) {
                renderableWidth = windowWidth;
                renderableHeight = rows * (renderableWidth / cols);
                xStart = 0;
                yStart = ( windowHeight  - renderableHeight) / 2;
            }
        
            ///keep aspect ratio
            else {
                renderableHeight =  windowHeight ;
                renderableWidth = windowWidth;
                xStart = 0;
                yStart = 0;
            }
            return {
                y2 : yStart + renderableHeight,
                x2 : xStart + renderableWidth,
                x1 : xStart,
                y1 : yStart
            };
        };

        convertCanvasCoordsToGPUCoords = (canvas, AR) => {
            //GPU -> -1, -1, 1, 1
            //convert to 0 -> 1
            var _0To1 = {
                y2 : AR.y2/canvas.height,
                x2 : AR.x2/canvas.width,
                x1 : AR.x1/canvas.width,
                y1 : AR.y1/canvas.height
            };
            //Convert -1 -> 1
            return {
                y2 : -1 + _0To1.y2 * 2.0,
                x2 : -1 + _0To1.x2 * 2.0,
                x1 : -1 + _0To1.x1 * 2.0,
                y1 : -1 + _0To1.y1 * 2.0
            };
        };
        
        //convert -1->+1 to 0.0->1.0
        convertVertexToTexCoords = (x1, y1, x2, y2) => {
            return {
                y2 : (y2 + 1.0)/2.0,
                x2 : (x2 + 1.0)/2.0,
                x1 : (x1 + 1.0)/2.0,
                y1 : (y1 + 1.0)/2.0
            };
        };

        activateTextureByIndex = (gl, program, gpuRef, gpuTextureIndex) => {
            gl.useProgram(program);
            gl.uniform1i(gl.getUniformLocation(program, gpuRef), gpuTextureIndex);
        };

        prepareVec4 = (_) => {
            return [_.x1, _.y1, 0.0, 1.0,
                _.x2, _.y1, 0.0, 1.0,
                _.x1, _.y2, 0.0, 1.0,
                _.x2, _.y1, 0.0, 1.0,
                _.x1, _.y2, 0.0, 1.0,
                _.x2, _.y2, 0.0, 1.0];
        };
        
        prepareVec2 = (_) => {
            return [_.x1, _.y1,
                _.x2, _.y1, 
                _.x1, _.y2, 
                _.x2, _.y1,
                _.x1, _.y2,
                _.x2, _.y2];
        };
    };
            </script>

<!-- end snippet -->

I am able to render a 8 bit histogram in both WebGL1 and WebGL2 using [this code](https://jsfiddle.net/greggman/9amgpndt/). But I need to generate a 16 bit histogram using 16 bit texture.

Here's how am sending the texture to GPU:

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
  gl.RGBA_INTEGER, //format -> gl.RGBA_INTEGER
  gl.UNSIGNED_SHORT, // type -> gl.UNSIGNED_SHORT
  img // texture data
 );


So, take the working [example](https://jsfiddle.net/greggman/9amgpndt/) in mind, I am stuck with few things :

1) How to create a 65536 X 1 framebuffer/texture to keep the 16 bit histogram as WebGL clearly says : `WebGL: INVALID_VALUE: texImage2D: width or height out of range`. Can we try a 256 x 256 framebuffer? I tried but stuck in point no. 2 below.

2) How to read through the pixels inside the vertex shader in case of 16 bit, below code is for 8-bit data, will it work for 16 bit as well? As I can't debug, so can't say whether it works or not: 

 <script id="hist-vs" type="not-js">
 attribute float pixelId;

 uniform vec2 u_resolution;
 uniform sampler2D u_texture;
 uniform vec4 u_colorMult;

 void main() {
 // based on an id (0, 1, 2, 3 ...) compute the pixel x, y for the source image
 vec2 pixel = vec2(mod(pixelId, u_resolution.x), floor(pixelId / u_resolution.x));

 // compute corresponding uv center of that pixel
 vec2 uv = (pixel + 0.5) / u_resolution;

 // get the pixels but 0 out channels we don't want
 vec4 color = texture2D(u_texture, uv) * u_colorMult;

 // add up all the channels. Since 3 are zeroed out we'll get just one channel
 float colorSum = color.r + color.g + color.b + color.a;

 // set the position to be over a single pixel in the 256x1 destination texture
 gl_Position = vec4((colorSum * 255.0 + 0.5) / 256.0 * 2.0 - 1.0, 0.5, 0, 1);

 gl_PointSize = 1.0;
 }
 </script>




## Answer:

If you just want answers to your 2 questions then

> 1) How to create a 65536 X 1 framebuffer/texture to keep the 16 bit histogram as WebGL clearly says : WebGL: INVALID_VALUE: texImage2D: width or height out of range. Can we try a 256 x 256 framebuffer? 

yes, you'd make 256x256 texture if you want to know the totals for each of the 65536 possible values 

> 2) How to read through the pixels inside the vertex shader in case of 16 bit, below code is for 8-bit data, will it work for 16 bit as well? As I can't debug, so can't say whether it works or not:

Of course you can debug. You try it and see if the results are correct. If they aren't you look at your code and or the error messages and try to figure out why. That's called debugging. Make a 1x1 texture, call your function, check if the histogram has the correct count of 1 for that 1x1 pixel input by calling `gl.readPixels`. Then try 2x1 or 2x2.

In any case you can't read `gl.RGBA16UI` textures with GLSL 1.0 es. You have to use version 300 es so if you actually want to create a separate bucket for all 65536 values then

Here's some a WebGL2 GLSL 3.00 ES shader that will fill out the totals for values from 0 to 65535 in a 256x256 texture

```
#version 300 es

uniform usampler2D u_texture;
uniform uvec4 u_colorMult;

void main() {
  const int mipLevel = 0;

  ivec2 size = textureSize(u_texture, mipLevel);

  // based on an id (0, 1, 2, 3 ...) compute the pixel x, y for the source image
  vec2 pixel = vec2(
     gl_VertexID % size.x,
     gl_VertexID / size.x);

  // get the pixels but 0 out channels we don't want
  uvec4 color = texelFetch(u_texture, pixel, mipLevel) * u_colorMult;

  // add up all the channels. Since 3 are zeroed out we'll get just one channel
  uint colorSum = color.r + color.g + color.b + color.a;

  vec2 outputPixel = vec2(
     colorSum % 256u,
     colorSum / 256u);

  // set the position to be over a single pixel in the 256x256 destination texture
  gl_Position = vec4((outputPixel + 0.5) / 256.0 * 2.0 - 1.0, 0, 1);

  gl_PointSize = 1.0;
}
```

[Example](https://jsfiddle.net/greggman/sawx4507/)

Notes:

* In WebGL2 you don't need pixelID, you can use `gl_VertexID` so no need to setup any buffers or attributes. Just call 

    ```
    const numPixels = img.width * img.height;
    gl.drawArrays(gl.POINTS, 0, numPixels);
    ```

* You can use `textureSize` to get the size of a texture so no need to pass it in. 

* You can use `texelFetch` to get a single texel(pixel) from a texture. It takes integer pixel coordinates.

* To read an unsigned integer texture format like RGBA16UI you have to use a `usampler2D` otherwise you'll get an error at draw time drawing to use an `RGBA16UI` texture on a `sampler2D` (this is how I know you weren't actually using a `RGBA16UI` texture because you would have gotten an error in the JavaScript console telling you and leading you to change your shader.

* You still need to use a floating point texture as the target because the technique used requires blending but blending doesn' work with integer textures (just in case you got the idea to try to use an integer based texture in the framebuffer)


<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/3085578">graphics123</a>
    from
    <a data-href="https://stackoverflow.com/questions/58015221">here</a>
  </div>
</div>
