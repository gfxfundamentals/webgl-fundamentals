Title: samplerCube in struct cause GL_INVALID_OPERATION
Description:
TOC: qna

# Question:

I have the following code in glsl:

    // snippet 1, works well
    uniform vec4 uDiffuse;
    uniform sampler2D uDiffuseMap;
    uniform vec4 uSpecular;
    uniform sampler2D uSpecularMap;
    uniform float uShininess;
    uniform samplerCube uEnvironmentMap;

    // snippet 2, not work
    struct PhongMaterial {
      vec4 diffuse;
      sampler2D diffuseMap;
    
      vec4 specular;
      sampler2D specularMap;
    
      float shininess;

      samplerCube environmentMap; // works well if I remove this line.
    };

But it throw the following error:

    [.WebGL-0x7fabfe002e00]RENDER WARNING: there is no texture bound to the unit 0
    [.WebGL-0x7fabfe002e00]GL ERROR :GL_INVALID_OPERATION : GetShaderiv: <- error from previous GL command
    [.WebGL-0x7fabfe002e00]GL ERROR :GL_INVALID_OPERATION : GLES2DecoderImpl::DoBindTexImage2DCHROMIUM: <- error from previous GL command
    [.WebGL-0x7fabfe002e00]GL ERROR :GL_INVALID_OPERATION : glFramebufferTexture2D: <- error from previous GL command
    [.WebGL-0x7fabfe002e00]GL ERROR :GL_INVALID_OPERATION : GLES2DecoderImpl::DoBindTexImage2DCHROMIUM: <- error from previous GL command
    WebGL: too many errors, no more errors will be reported to the console for this context.

Here is an example: 
https://codepen.io/scarletsky/pen/KEgBzx?editors=1010

What I want to do is to implement a shader which can receive `sampler2D` and `samplerCube`. When no `samplerCube` passed in the shader, it will throw error.

I have no idea what to do next. Can anyone help me ?


# Answer

Your real error is likely some where else and related to you not binding your textures correctly or looking up the wrong locations or something else

> RENDER WARNING: there is no texture bound to the unit 0

Here's a working example with your uniform structure

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const fs = `
    precision mediump float;

    struct PhongMaterial {
      vec4 diffuse;
      sampler2D diffuseMap;

      vec4 specular;
      sampler2D specularMap;

      float shininess;

      samplerCube environmentMap; 
    };
    uniform PhongMaterial material;

    void main() {
      vec4 diffuse  = texture2D(material.diffuseMap, gl_PointCoord.xy);
      vec4 specular = texture2D(material.specularMap, gl_PointCoord.xy);
      vec4 cube = textureCube(
         material.environmentMap, 
         vec3(gl_PointCoord.xy, gl_PointCoord.x * gl_PointCoord.y) * 2. - 1.);
         
      // use all 3 textures so we can see they were set
      vec4 diffuseOrSpecular = mix(diffuse, specular, step(0.25, gl_PointCoord.y));
      gl_FragColor = mix(diffuseOrSpecular, cube, step(0.5, gl_PointCoord.y));
    }
    `
    const vs = `
    void main() {
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 128.0;
    }
    `;

    const gl = document.querySelector('canvas').getContext('webgl');
    const prg = twgl.createProgram(gl, [vs, fs]);
    const diffuseLocation = gl.getUniformLocation(prg, 'material.diffuseMap');
    const specularLocation = gl.getUniformLocation(prg, 'material.specularMap');
    const envmapLocation = gl.getUniformLocation(prg, 'material.environmentMap');

    const texDiffuse = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texDiffuse);
    {
      const level = 0;
      const format = gl.RGBA;
      const width = 1;
      const height = 1;
      const type = gl.UNSIGNED_BYTE;
      const pixel = new Uint8Array([255, 255, 0, 255]);  // yellow
      gl.texImage2D(gl.TEXTURE_2D, level, format, width, height, 0, format, type, pixel);
    }

    const texSpecular = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texSpecular);
    {
      const level = 0;
      const format = gl.RGBA;
      const width = 1;
      const height = 1;
      const type = gl.UNSIGNED_BYTE;
      const pixel = new Uint8Array([0, 0, 255, 255]);  // blue
      gl.texImage2D(gl.TEXTURE_2D, level, format, width, height, 0, format, type, pixel);
    }

    const texCube = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texCube);
    for (let i = 0; i < 6; ++i) {
      const level = 0;
      const format = gl.RGBA;
      const width = 1;
      const height = 1;
      const type = gl.UNSIGNED_BYTE;
      const pixel = new Uint8Array([(i & 1) * 255, (i & 2) * 255, (i & 4) * 255, 255]);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, level, format, width, height, 0, format, type, pixel);
    }

    gl.useProgram(prg);

    // put the yellow diffuse texture on texture unit 0
    gl.activeTexture(gl.TEXTURE0 + 0);  
    gl.bindTexture(gl.TEXTURE_2D, texDiffuse);

    // use texture on texture unit 0
    gl.uniform1i(diffuseLocation, 0);   

    // put the blue specular texture on texture unit 1
    gl.activeTexture(gl.TEXTURE0 + 1);  
    gl.bindTexture(gl.TEXTURE_2D, texSpecular);

    // tell the specular sampler to use texture unit 1
    gl.uniform1i(specularLocation, 1);  

    // put the cubemap on texture unit 2
    gl.activeTexture(gl.TEXTURE0 + 2);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texCube);

    // tell the cubemap sampler to use texture unit 2
    gl.uniform1i(envmapLocation, 2);    

    // draw one 128x128 pixel point
    gl.drawArrays(gl.POINTS, 0, 1);  

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

NOTE: you are required to supply a valid texture for every sampler uniform your shader claims is being used regardless of whether or not it is actually being used. 

To find out if the shader claims it's being used call 

```
gl.getUniformLocation(program, nameOfSamplerUniform);
```

If it returns non-null then AFAIK as WebGL is concerned you must supply a valid texture for that sampler. 

If you don't actually need one (because of conditionals or something) then keep around a 1 pixel texture for 2D or 6 pixel texture, 1 pixel per face for cube maps and attach that texture when you don't need a specific texture. 

For these cases I usually keep a white and/or black texture around. For example let's say I had math like

    color = diffuseMapColor * diffuseColor + envMapColor;

If I only want `diffuseColor` then I can set `diffuseMapColor` to white and `envMapColor` to black which is effectively

    color = 1 * diffuseColor + 0;

Similarly of I only want `diffuseMapColor` I can set `diffuseColor` to white and `envMapColor` to black and get

    color = diffuseMapColor * 1 + 0;

and if I only want `envMapColor` then setting `diffuseColor` to 0 will work

    color = diffuseMapColor * 0 + envMapColor;

is the same as

    color = 0 + envMapColor;

On the other hand, most 3D engines would generate a different shaders for these cases. If no environment map is used they'd generate a shader that doesn't include an environment map. This is because generally doing less work in a shader is faster than doing more so a good 3D engine generates shaders for each case of what is needed.
