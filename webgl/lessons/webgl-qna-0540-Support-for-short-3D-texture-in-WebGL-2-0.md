Title: Support for short 3D texture in WebGL 2.0
Description:
TOC: qna

# Question:

I am attempting to load a short 3D texture in WebGL 2.0 in Firefox.

While unsigned 1 byte 3D textures load without any problem, I am struggling to do the same for any other pixel type.
My js code:

    var SIZE = 512;
    var data = new Int16Array(SIZE * SIZE * SIZE);
    data.fill(400);

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    gl.texImage3D(
        gl.TEXTURE_3D,  // target
        0,              // level
        gl.R16I,        // internalformat
        SIZE,           // width
        SIZE,           // height
        SIZE,              // depth
        0,              // border
        gl.RED_INTEGER,         // format
        gl.SHORT,       // type
        data            // pixel
       );

I am not generating mip maps on this texture.

When trying to sample texture in the fragment shader I get 0 for each pixel.

FS code:

    #version 300 es
    
    precision highp float;
    precision highp int;
    precision highp sampler3D;
    
    uniform sampler3D textureData;
    
    in vec3 v_texcoord;
    
    out vec4 color;
    
    void main()
    {
       vec4 value = texture(textureData, v_texcoord);
       if( value.x == 0.0 )
          color = vec4(1.0, 0.0, 0.0, 1.0);
       else if( value.x == 1.0)
          color = vec4(1.0, 1.0, 0.0, 1.0);
       else if( value.x < 0.0 )
          color = vec4(0.0, 0.0, 1.0, 1.0);
       else
          color = vec4(1.0,1.0,1.0,1.0);
    }

Any help would be appreciated.

# Answer

You need to use a `isampler3D` to sample a integer format texture in which case `texture` returns an `ivec4`

[From the spec section 8.8](https://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.3.pdf)

> Texture lookup functions are provided that can return their result as floating point, unsigned integer or
signed integer, depending on the sampler type passed to the lookup function. Care must be taken to use
the right sampler type for texture access. The following table lists the supported combinations of sampler
types and texture internal formats. Blank entries are unsupported. Doing a texture lookup will return
undefined values for unsupported combinations.

> <!-- language: lang-none -->
> 
>      Internal   
>      Texture           | Floating Point | Signed Integer | Unsigned Integer |
>      Format            | Sampler Types  | Sampler Types  | Sampler Types    |
>     -------------------+----------------+----------------+------------------+
>      Floating point    |   Supported    |                |                  |
>     -------------------+----------------+----------------+------------------+
>      Normalized Integer|   Supported    |                |                  |
>     -------------------+----------------+----------------+------------------+
>      Signed Integer    |                |   Supported    |                  |
>     -------------------+----------------+----------------+------------------+
>      Unsigned Integer  |                |                |   Supported      |
>     -------------------+----------------+----------------+------------------+

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("#c").getContext("webgl2");
    if (!gl) {
      alert("needs webgl 2.0");
    }

    var SIZE = 512;
    var data = new Int16Array(SIZE * SIZE * SIZE);
    data.fill(400);

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAX_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage3D(
        gl.TEXTURE_3D,  // target
        0,              // level
        gl.R16I,        // internalformat
        SIZE,           // width
        SIZE,           // height
        SIZE,              // depth
        0,              // border
        gl.RED_INTEGER,         // format
        gl.SHORT,       // type
        data            // pixel
       );

    // FS code:

    var fs = `#version 300 es

    precision highp float;
    precision highp int;
    precision highp isampler3D;

    uniform isampler3D textureData;

    in vec3 v_texcoord;

    out vec4 color;

    void main()
    {
       ivec4 value = texture(textureData, v_texcoord);
       if( value.x == 0 )
          color = vec4(1.0, 0.0, 0.0, 1.0);
       else if( value.x == 1)
          color = vec4(1.0, 1.0, 0.0, 1.0);
       else if( value.x < 0 )
          color = vec4(0.0, 0.0, 1.0, 1.0);
       else
          color = vec4(0.0,1.0,1.0,1.0);
    }
    `;

    var vs = `#version 300 es
    in vec4 position;
    out vec3 v_texcoord;
    void main() {
      gl_Position = position;
      v_texcoord = vec3(0);
    }
    `

    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.drawBufferInfo(gl, bufferInfo);

<!-- language: lang-css -->

    canvas { border: 1px solid black; background: purple; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <canvas id="c"><canvas>

<!-- end snippet -->


