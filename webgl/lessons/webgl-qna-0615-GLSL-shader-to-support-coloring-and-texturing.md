Title: GLSL shader to support coloring and texturing
Description:
TOC: qna

# Question:

Im trying to write a shader that support both color and texture.  
For some reason I can make it work.  
No errors threw and each of them work perfect separately,

get location:

    shaderProgram.useTextureUniform = gl.getUniformLocation(shaderProgram, "uUseTexture");

when drawing I change the value like this:

  var uUseTexture=false;
  gl.uniform1f(shaderProgram.useTextureUniform, uUseTexture);
And the GLSL itself:

fragment:

    precision mediump float;
    uniform sampler2D uSampler;
    varying vec2 vTextureCoord;
    varying vec4 vColor;
    uniform bool uUseTexture;
    void main(void) {
        vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        vec4 texColor = vec4(textureColor.rgb, textureColor.a);
  vec4 vertexColor = vColor; 
  if (!uUseTexture){
   gl_FragColor = vertexColor;
  }
  else{
   gl_FragColor = texColor; 
  }
    }

vertex:
   

        attribute vec3 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoord;
     attribute vec4 aVertexColor;
     
        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;
        uniform mat3 uNMatrix;
   
        varying vec2 vTextureCoord;
     varying vec4 vColor;
     
     
        void main(void){
            vec4 mvPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
            gl_Position = uPMatrix * mvPosition;
            vTextureCoord = aTextureCoord;
      vColor = aVertexColor;}

# Answer

Before I tell you how to make your shader work you arguably should not do it that way. You should either

1.  Make 2 shaders

    Make one shader that uses a texture and a different shader that uses vertex colors. This is what nearly all professional game engines would do.

2.  Make a shader that multiplies both colors and set one to white

    If you have

        gl_FragColor = vertexColor * textureColor;

    Then if `textureColor` is `1,1,1,1` that means you're multiplying by 1 
    and so the result is just `vertexColor`. Similarly if `vertexColor`
    is `1,1,1,1` then you're multiplying by 1 and so the result is just
    `textureColor`

    You can get a white texture by making just a single pixel white texture

        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
                      gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

    Then anytime you just want vertex colors bind that texture to a texture
    unit and tell the sampler which unit it you put it in

    You might also want to turn off texture coordinates

        gl.disableVertexAttribArray(texcoordLocation);

    When you want just texture color then you can do this

        // turn off the attribute
        gl.disableVertexAttribArray(aVertexColorLocation);
        
        // set the attribute's constant value
        gl.vertexAttrib4f(aVertexColorLocation, 1, 1, 1, 1);

    This method has the added benefit that you can also use both texture colors and vertex colors together to modify the texture color or to tint the texture color. Many game engines would do this as well specifically to take advantage of that ability to blend the colors.

3.  Pauli mentions another option which is to use mix


        uniform float u_mixAmount;

        gl_FragColor = mix(textureColor, vertexColor, u_mixAmount);

    This would also work as you can set `u_mixAmount` to 0.0 when you want
    `textureColor` and to 1.0 when you want `vertexColor` but unlike your
    boolean example you can also fade between the 2 colors with values
    between 0.0 and 1.0.  For example 0.3 is 30% of `vertexColor` and 70%
    of `textureColor`


A few other things

This line

    vec4 texColor = vec4(textureColor.rgb, textureColor.a);

Is no different than

    vec4 texColor = textureColor;

Just trying your shader it seems to work as is which suggests the issue is not your shader but some other part of your code.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("canvas").getContext("webgl");
    var m4 = twgl.m4;

    var arrays = {
      aVertexPosition: [
        -1, -1, 0,
         1, -1, 0,
        -1,  1, 0,
         1,  1, 0,
      ],
      aVertexNormal: [
         0,  0,  1,
         0,  0,  1,
         0,  0,  1,
         0,  0,  1,
      ],
      aTextureCoord: [
         0,  0, 
         1,  0,
         0,  1,
         1,  1,
      ],
      aVertexColor: [
         1, 0, 0, 1,
         0, 1, 0, 1,
         0, 0, 1, 1,
         1, 0, 1, 1,
      ],
      indices: [
        0, 1, 2,
        2, 1, 3,
      ],
    };
        
    var tex = twgl.createTexture(gl, {
      format: gl.LUMINANCE,
      mag: gl.NEAREST,
      src: [224, 64, 128, 192],
    });
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    var programInfo = twgl.createProgramInfo(gl, ['vs', 'fs']);
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    for (var i = 0; i < 2; ++i) {
      twgl.setUniforms(programInfo, {
        uMVMatrix: m4.identity(),
        uPMatrix: m4.scale(m4.translation([i === 0 ? -0.5 : 0.5, 0, 0]), [0.5, 1, 1]),
        uNMatrix: m4.identity(),
        uSampler: tex,
        uUseTexture: i === 1,
      });
      twgl.drawBufferInfo(gl, bufferInfo);
    }

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <script id="fs" type="not-js">
    precision mediump float;
    uniform sampler2D uSampler;
    varying vec2 vTextureCoord;
    varying vec4 vColor;
    uniform bool uUseTexture;
    void main(void) {
        vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        vec4 texColor = vec4(textureColor.rgb, textureColor.a);
        vec4 vertexColor = vColor; 
        if (!uUseTexture){
            gl_FragColor = vertexColor;
        }
        else{
            gl_FragColor = texColor; 
        }
    }
    </script>
    <script id="vs" type="not-js">
        attribute vec3 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoord;
        attribute vec4 aVertexColor;

        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;
        uniform mat3 uNMatrix;

        varying vec2 vTextureCoord;
        varying vec4 vColor;


        void main(void){
            vec4 mvPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
            gl_Position = uPMatrix * mvPosition;
            vTextureCoord = aTextureCoord;
            vColor = aVertexColor;}
    </script>
    <canvas></canvas>

<!-- end snippet -->


