Title: Blank canvas when trying to import image for texture mapping
Description:
TOC: qna

# Question:

I am working on a web application using Nitrous.IO which is a Ruby-on-Rails framework and wanting to create 3D graphics using WebGL within the pages.  I have come into a problem where the image does not show up and I believe it is a blank texture.  Within the canvas (that does show up) should be a spinning cube, but the .png file that is supposed to be the texture will not show up.  The image is in my /assets/images folder and labeled as "nehe.png".  Here are the two shaders that I am using:

    <script id="shader-fs" type="x-shader/x-fragment">
    precision mediump float;

    varying vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    }
</script>

    <script id="shader-vs" type="x-shader/x-vertex">
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec2 vTextureCoord;

    void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vTextureCoord = aTextureCoord;
    }
</script>

And then here is the code that should import the texturing:

    function handleLoadedTexture(texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var neheTexture;

    function initTexture() {
        neheTexture = gl.createTexture();
        neheTexture.image = new Image();
        neheTexture.image.onload = function () {
            handleLoadedTexture(neheTexture)
        }
        neheTexture.image.src = "nehe.png";
    }

I can't think of another way to upload the picture in rails besides using the (%= image_tag %>, but when I use that the page does not load and an error is produced.  If there is anyone who can help, that would be great.  I would like to end up using a .jpeg file as a texture, but .png is a good start.

Thanks!

# Answer

what size is the texture? you're not setting `gl.TEXTURE_WRAP_S` and `gl.TEXTURE_WRAP_T` to `gl.CLAMP_TO_EDGE` so if your texture is not a power-of-2 in both dimensions it won't render. AND, you should have seen an error telling you that in the JavaScript console.

You also need to show more code. Where is your drawing code? Since you're unbinding the texture how do we know you're re-binding it before drawing? What values are you using for your uniforms? 

The simplest way to check if it's the texture is to change your fragment shader to just

    precision mediump float;
    
    varying vec2 vTextureCoord;
    
    uniform sampler2D uSampler;
    
    void main(void) {
        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        gl_FragColor = vec4(1,0,0,1); // red
    }

If you see a red spinning cube than the issue is probably your texture. If you don't see a red spinning cube your error is somewhere else.

