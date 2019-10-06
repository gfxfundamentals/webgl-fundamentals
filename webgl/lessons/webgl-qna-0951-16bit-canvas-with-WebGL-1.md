Title: 16bit canvas with WebGL 1
Description:
TOC: qna

# Question:

I know that it's possible to create 16bit image with WebGL according to [this][1].  
I created such sample with WebGL1 but when I try to save image from canvas I get 8bit per channel image.  
So, I'm not sure that this image is really 16bit per channel, is it possible to get 16bit PNG from canvas? And is it really possible with WebGL 1?

Here is sample of shader:

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision highp float;
    precision highp sampler2D;
    
    // our textures
    uniform sampler2D u_image0;
    uniform sampler2D u_image1;
    
    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;
    
    void main() {
       highp vec4 color0 = texture2D(u_image0, v_texCoord);
       highp vec4 color1 = texture2D(u_image1, v_texCoord);
       
       gl_FragColor = color0 * (256.0 / 257.0) + color1 * (1.0 / 257.0);
    }
    </script>

Example how I bind texture:

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.FLOAT, images[ii]);

Thank you in advance for any help.

  [1]: https://stackoverflow.com/questions/6413744/looking-to-access-16-bit-image-data-in-javascript-webgl

# Answer

The canvas itself can currently only be 8bits per channel. WebGL can create 16bit textures with the correct extensions. WebGL2 can also. That data can be read out using `gl.readPixels` but it would be up to you to save it to a PNG using some code written in JavaScript or WASM that creates 16bit PNGs.

There is new proposal for 16bit floating point canvases since several monitors and TVs now support more than 8bit input.

https://github.com/WICG/canvas-color-space/blob/master/CanvasColorSpaceProposal.md
