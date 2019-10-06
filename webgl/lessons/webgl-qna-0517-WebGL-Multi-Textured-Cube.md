Title: WebGL Multi-Textured Cube
Description:
TOC: qna

# Question:

I need to texture a cube with different textures for each side, unless there is an advantage doing it by single side. This is my Vertex Shader:..

    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec2 vertTexCoord;
    attribute float aFace;
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

    varying vec2 fragTexCoord;
    varying float vFace;

    void main()
    {
      fragTexCoord = vertTexCoord;
      vFace = aFace;
      gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
    }
Fragment Shader:..

    precision mediump float;

    uniform sampler2D front;
    uniform sampler2D back;
    uniform sampler2D top;
    uniform sampler2D bottom;
    uniform sampler2D right;
    uniform sampler2D left;

    varying vec2 fragTexCoord;
    varying float vFace;

    void main()
    {
   if(vFace < 0.1)
   gl_FragColor = texture2D(front, fragTexCoord);
   else if(vFace < 1.1)
   gl_FragColor = texture2D(back, fragTexCoord);
   else if(vFace < 2.1)
   gl_FragColor = texture2D(top, fragTexCoord);
   else if(vFace < 3.1)
   gl_FragColor = texture2D(bottom, fragTexCoord);
   else if(vFace < 4.1)
   gl_FragColor = texture2D(right, fragTexCoord);
   else
   gl_FragColor = texture2D(left, fragTexCoord);
    }totorials
Then before I start rendering this runs. (The variables are globally defined):..

 cubeVertexBufferObject = gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferObject);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

 cubeIndexBufferObject = gl.createBuffer();
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBufferObject);
 gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

 textureLookUpBuffer = gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER, textureLookUpBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lookUpArray), gl.STATIC_DRAW);

 cubeVertexTextureCoordBuffer = gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

 positionAttributeLocation = gl.getAttribLocation(program, 'vertPosition');
 gl.vertexAttribPointer(
  positionAttributeLocation,
  3,
  gl.FLOAT,
  gl.FALSE,
  5 * Float32Array.BYTES_PER_ELEMENT,
  0
 );

 texCoordAttributeLocation = gl.getAttribLocation(program, 'vertTexCoord');
 gl.vertexAttribPointer(
  texCoordAttributeLocation,
  2,
  gl.FLOAT,
  gl.FALSE,
  5 * Float32Array.BYTES_PER_ELEMENT,
  3 * Float32Array.BYTES_PER_ELEMENT
 );
 
 textureLookUpAttribute = gl.getAttribLocation(program, "aFace");
 gl.vertexAttribPointer(
  textureLookUpAttribute,
  1,
  gl.FLOAT,
  false,
  0,
  0
 );
 
 faces.front = gl.getUniformLocation(program,"front");
 faces.back = gl.getUniformLocation(program,"back");
 faces.top = gl.getUniformLocation(program,"top");
 faces.bottom = gl.getUniformLocation(program,"bottom");
 faces.right = gl.getUniformLocation(program,"right");
 faces.left = gl.getUniformLocation(program,"left");
 //
 cubeMatWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
 cubeMatViewUniformLocation = gl.getUniformLocation(program, 'mView');
 cubeMatProjUniformLocation = gl.getUniformLocation(program, 'mProj');

 worldMatrix = new Float32Array(16);
 viewMatrix = new Float32Array(16);
 projMatrix = new Float32Array(16);

 mat4.identity(worldMatrix);
 mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
 mat4.perspective(projMatrix, glMatrix.toRadian(45), Canvas.width / Canvas.height, 0.1, 1000.0);

 gl.uniformMatrix4fv(cubeMatWorldUniformLocation, gl.FALSE, worldMatrix);
 gl.uniformMatrix4fv(cubeMatViewUniformLocation, gl.FALSE, viewMatrix);
 gl.uniformMatrix4fv(cubeMatProjUniformLocation, gl.FALSE, projMatrix);
Finally every time I render this runs:..

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferObject);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, textureLookUpBuffer);
    gl.vertexAttribPointer(textureLookUpAttribute, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBufferObject);

 gl.activeTexture(gl.TEXTURE0);
 gl.bindTexture(gl.TEXTURE_2D, texture);
 gl.uniform1i(faces.front, 0);

 gl.activeTexture(gl.TEXTURE1);
 gl.bindTexture(gl.TEXTURE_2D, grass);
 gl.uniform1i(faces.back, 1); 

 gl.activeTexture(gl.TEXTURE2);
 gl.bindTexture(gl.TEXTURE_2D, texture);
 gl.uniform1i(faces.top, 2);

 gl.activeTexture(gl.TEXTURE3);
 gl.bindTexture(gl.TEXTURE_2D, grass);
 gl.uniform1i(faces.bottom, 3);

 gl.activeTexture(gl.TEXTURE4);
 gl.bindTexture(gl.TEXTURE_2D, texture);
 gl.uniform1i(faces.right, 4);

 gl.activeTexture(gl.TEXTURE5);
 gl.bindTexture(gl.TEXTURE_2D, grass);
 gl.uniform1i(faces.left, 5);

 gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
It gives me error messages. Their different when I changed the code slightly(When I was trying to fix it) so that why i don't have an exact error message. If you need the different arrays for the cube i can post them. I was fallowing online tutorials on how to do this(on in general) but obviously as you can see it didn't work.

# Answer

The most common way to texture a cube with a different face on each side is to use a [texture atlas](https://en.wikipedia.org/wiki/Texture_atlas). Put all the faces in 1 texture and use texture coordinates to select the right part of the texture for each face.

[See the bottom of this article](http://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html)

The advantages are there's 1 texture. 1 texture unit to setup. 1 uniform to set. More samplers left for other things (normal maps, etc..) A simple shader that runs faster.


