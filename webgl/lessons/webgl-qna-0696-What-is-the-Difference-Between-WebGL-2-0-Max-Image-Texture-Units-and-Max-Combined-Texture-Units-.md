Title: What is the Difference Between WebGL 2.0 Max Image Texture Units and Max Combined Texture Units?
Description:
TOC: qna

# Question:

I'm currently working on a GLSL shader which is using a large number of texture files to layer multiple materials on top of each other, which are masked off individually by an alpha blend image for each layer. The effect is supposed to mimic a fabric with a backer, a middle mesh, and a third mesh on top. In working on this, I've quickly run into limits on texture units in my shader. As a solution, I'm going to start combining textures into RGB channels to get a few more textures available to the shader, and looking into combining multiple diffuse images or others into a single image. But in the meantime, my question is:

Will WebGL 2.0 offer more texture units, or is this something limited by the graphics card itself? And just as a general knowledge question, is the Max Combined Texture Unit number the total number of texture units I can have on a WebGL context? How is that different from Max Texture Units? I'm just trying to understand the limitations here. Below is the results from Browserleaks for WebGL on my Macbook Pro.

[![WebGL Browserleaks Report][1]][1]


  [1]: https://i.stack.imgur.com/kjx6n.png

# Answer

`MAX_COMBINED_TEXTURE_IMAGE_UNITS` is the total number of texture units that exist.

`MAX_TEXTURE_IMAGE_UNITS` is the total number of texture units you can use in a fragment shader

`MAX_VERTEX_TEXTURE_IMAGE_UNITS` is the total number of texture units you can use in a vertex shader

You query these values by calling `gl.getParameter`

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main(webglVersion) {
      const gl = document.createElement('canvas').getContext(webglVersion);
      if (!gl) {
        return console.log('no', webglVersion);
      }
      console.log(webglVersion);
      console.log(
        'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
        gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS));
      console.log(
        'MAX_TEXTURE_IMAGE_UNITS',
        gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
      console.log(
        'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
        gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS));
    }
    main('webgl');
    main('webgl2');

<!-- end snippet -->

Let's assume you got these results

```
MAX_COMBINED_TEXTURE_IMAGE_UNITS 20
MAX_TEXTURE_IMAGE_UNITS 8
MAX_VERTEX_TEXTURE_IMAGE_UNITS 16
```

That would mean you could use up to 8 in the vertex shader and up to 16 in the fragment shader but in total you could not use more than 20.

> Will WebGL 2.0 offer more texture units, or is this something limited by the graphics card itself?

WebGL 2.0 requires a minimum higher than the minimums of WebGL1. Generally on the same GPU they most likely offer the same number but there are GPUs that support WebGL1 that don't support WebGL2

Minimum guaranteed values for WebGL vs WebGL2

```
                                   WebGL1  WebGL2
MAX_COMBINED_TEXTURE_IMAGE_UNITS     8       32
MAX_TEXTURE_IMAGE_UNITS              8       16
MAX_VERTEX_TEXTURE_IMAGE_UNITS       0       16
```

Notice that the minimum in WebGL1 for `MAX_VERTEX_TEXTURE_IMAGE_UNITS` is 0. This means using textures in a vertex shader is an optional feature on WebGL1. Fortunately [most devices support at least 4](http://webglstats.com/webgl/parameter/MAX_VERTEX_TEXTURE_IMAGE_UNITS)
