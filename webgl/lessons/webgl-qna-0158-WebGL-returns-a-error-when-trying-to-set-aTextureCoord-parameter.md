Title: WebGL returns a error when trying to set aTextureCoord parameter
Description:
TOC: qna

# Question:

I have a simple webGL program which I am almost copy pasting from [Mozilla developer network][1]. For some reason I manage to create a cube sides with a single colour and top and bottom with textures and textures are visible but I am not sure if the lightning is properly set. There is an error that I am trying to fix which is the following one and I noticed that the error happens to be occurring when I try to initiate shaders with aTextureCoord parameter. Following is my shader and the javascript code that I am trying to use. Can some one figure out why this happens. 
    <script id="shader-vs-texture" type="x-shader/x-vertex">
    attribute highp vec3 aVertexNormal;
    attribute highp vec3 aVertexPosition;
    attribute highp vec2 aTextureCoord;
       
    uniform highp mat4 uNormalMatrix;
    uniform highp mat4 uMVMatrix;
    uniform highp mat4 uPMatrix;

    varying highp vec3 vLighting;
    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
      vTextureCoord = aTextureCoord;

      highp vec3 ambientLight = vec3(0.6, 0.6, 0.6);
      highp vec3 directionalLightColor = vec3(0.5, 0.5, 0.75);
      highp vec3 directionalVector = vec3(0.85, 0.8, 0.75);
        
      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
       
      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
     }
    </script>

following is the javascript code.

       shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
   gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);   
   shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
   gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);   
   shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
   shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
   
   shaderProgram4Tex.vertexPositionAttribute = gl.getAttribLocation(shaderProgram4Tex, "aVertexPosition");
   gl.enableVertexAttribArray(shaderProgram4Tex.vertexPositionAttribute);   
   shaderProgram4Tex.vertexTextureAttribute = gl.getAttribLocation(shaderProgram4Tex, "aTextureCoord");
   gl.enableVertexAttribArray(shaderProgram4Tex.vertexTextureAttribute);   
   shaderProgram4Tex.pMatrixUniform = gl.getUniformLocation(shaderProgram4Tex, "uPMatrix");
   shaderProgram4Tex.mvMatrixUniform = gl.getUniformLocation(shaderProgram4Tex, "uMVMatrix");
   shaderProgram4Tex.vertexNormalAttribute = gl.getAttribLocation(shaderProgram4Tex, "aVertexNormal");
   gl.enableVertexAttribArray(shaderProgram4Tex.vertexNormalAttribute);
   shaderProgram4Tex.samplerUniform = gl.getUniformLocation(shaderProgram4Tex, "uSampler");
   shaderProgram4Tex.normalMatrix = gl.getUniformLocation(shaderProgram4Tex, "uNormalMatrix");

I get following error when I run the program. 


     WebGL: INVALID_OPERATION: drawElements: attribs not setup correctly

Hopefully someone can answer this as I have spent good 10 hours on this and could not figure out why this is.
  [1]: https://developer.mozilla.org/en-US/docs/Web/WebGL

# Answer

"attribs not setup correctly" means either 

1.  You have no program set up. In other words you didn't call `gl.useProgram` with a valid program.

2.  You turned on an attribute with `gl.enableVertexAttribArray` but you did not assign a buffer to it by calling `gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer)` followed at some point by calling `gl.vertexAttribPointer` which assigns the currently bound `ARRAY_BUFFER` to the specified attribute.
