Title: Linear filtering of floating point textures in WebGL2
Description:
TOC: qna

# Question:

I'm trying to get work Floating point textures in WebGL2. I initialize textures like this:

    function textureFromFloat32Array( gl, arr, w, h ){
        //https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_float_linear
        gl.getExtension('OES_texture_float');        // just in case
        gl.getExtension('OES_texture_float_linear'); // do I need this with WebGL2
        const texture = gl.createTexture();
        gl.bindTexture( gl.TEXTURE_2D, texture);
        // see https://www.khronos.org/registry/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, w, h, 0, gl.RED, gl.FLOAT, arr);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // this works
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return texture;
    }

In Firefox 55.0.2 (64-bit) it gives me following error:

`Error: WebGL warning: drawElements: Active texture 0 for target 0x0de1 is 'incomplete', and will be rendered as RGBA(0,0,0,1), as per the GLES 2.0.24 $3.8.2: Because minification or magnification filtering is not NEAREST or NEAREST_MIPMAP_NEAREST, and the texture's format must be "texture-filterable".`
    
With `gl.NEAREST` it works but I need linear interpolation.

In Chorme 60.0.3112.101 it works with  `gl.getExtension('OES_texture_float_linear');` but I guess when using `WebGL2` I should not need it.





# Answer

Even WebGL2 requires `OES_texture_float_linear`.

WebGL2 supports floating point textures by default but it does not support filtering them or rendering to them by default. Both of those are extensions. See the [tables on this page](https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html) for which texture formats are supported and whether or not you can filter them or render to them.

Most mobile phones do not support filtering floating point textures nor do they support rendering to floating point textures. At least as of September 2017.

To be able to filter floating point textures you need to check for and enable `OES_texture_float_linear`. To be able to render to floating point textures you need to check for and enable `EXT_color_buffer_float`
