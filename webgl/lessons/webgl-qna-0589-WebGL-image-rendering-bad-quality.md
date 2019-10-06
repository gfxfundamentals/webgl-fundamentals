Title: WebGL image rendering bad quality
Description:
TOC: qna

# Question:

I have a problem with image rendering in WebGL: I have a canva, with a quad that takes the whole canvas, and a texture which is supposed to be mapped onto the whole quad (I have set the correct texture coordinates).

The image is a Uint8array containing RGB data (in this order) and the image is 1024*768 pixels. I have the correct buffer. Here is the link to the image.

![Original Image][1]



The problem is the following: when rendered into WebGL, my picture becomes blurry and fuzzy, even if I have a canva that is the size of the image. See the result below:

![Rendered via WebGL][2]

Now for the code: Here is the code I use to create the texture handle:

    //texture
    that.Texture = that.gl.createTexture();   
    that.gl.bindTexture(that.gl.TEXTURE_2D, that.Texture);          
    
    // Set the parameters so we can render any size image.
    that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_WRAP_S, that.gl.CLAMP_TO_EDGE);
    that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_WRAP_T, that.gl.CLAMP_TO_EDGE);
    that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_MIN_FILTER, that.gl.NEAREST);
    that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_MAG_FILTER, that.gl.NEAREST);

The data is loaded onto the texture as follows:

    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.m_iImageWidth, this.m_iImageHeight,
    0, this.gl.RGB, this.gl.UNSIGNED_BYTE, this.m_aImage);

And finally, here is the fragment shader I use:

    precision mediump float;
    uniform sampler2D u_image;
    varying vec2 v_texCoord;
    void main() 
    {
       gl_FragColor = texture2D(u_image, v_texCoord);
    }

I have tried a lot of options, from filtering to setting style option image-rendering pixelated, converting the image in RGBA and giving it RGBA values and the results is always the same crappy texture rendering. It looks like WebGL does not correctly interpolates the data even though the canvas is the exact same size as the texture. 

Does any one have a hint?

Thanks in advance.

  [1]: http://i.stack.imgur.com/DrWGL.png
  [2]: http://i.stack.imgur.com/k3rhr.png



# Answer

Let's try it. 

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;
    attribute vec2 texcoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(position.xy * vec2(1, -1), 0, 1);
      v_texCoord = texcoord;
    }
    `;
    var fs = `
    precision mediump float;
    uniform sampler2D u_image;
    varying vec2 v_texCoord;
    void main() 
    {
       gl_FragColor = texture2D(u_image, v_texCoord);
    }`
    ;

    var gl = document.querySelector("canvas").getContext("webgl");
    var that = {
        gl: gl,
    };
    var img = new Image();
    img.crossOrigin = "";
    img.onload = function() {
      that.m_aImage = img;
      that.m_iImageWidth = img.width;
      that.m_iImageHeight = img.height;
      gl.canvas.width = img.width;
      gl.canvas.height = img.height;
      console.log("size: ", img.width, "x ", img.height);
      render.call(that);
    }
    img.src = "https://i.imgur.com/ZCfccZh.png";

    function render() {
      //texture
      that.Texture = that.gl.createTexture();         
      that.gl.bindTexture(that.gl.TEXTURE_2D, that.Texture);                          

      // Set the parameters so we can render any size image.
      that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_WRAP_S, that.gl.CLAMP_TO_EDGE);
      that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_WRAP_T, that.gl.CLAMP_TO_EDGE);
      that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_MIN_FILTER, that.gl.NEAREST);
      that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_MAG_FILTER, that.gl.NEAREST);

      // upload the image directly.
      //  this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, img);
      // upload the image indirectly
      var ctx = document.createElement("canvas").getContext("2d");
      ctx.canvas.width = this.m_iImageWidth;
      ctx.canvas.height = this.m_iImageHeight;
      ctx.drawImage(this.m_aImage, 0, 0);
      var imageData = ctx.getImageData(0, 0, this.m_iImageWidth, this.m_iImageHeight);
      var numPixels = this.m_iImageWidth * this.m_iImageHeight;
      var pixels = new Uint8Array(numPixels * 3);
      var src = 0;
      var dst = 0;
      for (var i = 0; i < numPixels; ++i) {
        pixels[src++] = imageData.data[dst++];
        pixels[src++] = imageData.data[dst++];
        pixels[src++] = imageData.data[dst++];
        ++dst;
      }  
      
      this.m_aImage = pixels;
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.m_iImageWidth, this.m_iImageHeight, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, this.m_aImage);
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      var bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
     }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Works for me. Although the image is apparently 800x600 not 1024x768. If your image isn't the same size as your canvas then you probably want to use `LINEAR` filtering instead of `NEAREST`.

Also, you can upload images directly rather than through an array buffer (same result but probably a lot smaller and faster and less memory)
