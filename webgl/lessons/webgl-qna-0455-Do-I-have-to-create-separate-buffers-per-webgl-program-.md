Title: Do I have to create separate buffers per webgl program?
Description:
TOC: qna

# Question:

Do I have to create separate webglbuffers if I have two programs or can I use the same ones in each?

        this.program = gl.createProgram();
  gl.attachShader(this.program, vs);
  gl.attachShader(this.program, fs);
  gl.linkProgram(this.program);
  //gl.useProgram(this.program);
  this.cellProgram = gl.createProgram();
  gl.attachShader(this.cellProgram, cvs);
  gl.attachShader(this.cellProgram, cfs);
  gl.linkProgram(this.cellProgram);
  //gl.useProgram(this.cellProgram);
  
  
  this.texCoordBuffer = gl.createBuffer();
  this.posCoordBuffer = gl.createBuffer();


and also would I need to bindbuffer and set bufferdata for each program? Or are the data/buffers shared between programs?

    gl.useProgram(program);
  
  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

  
  // provide texture coordinates for the rectangle.
  //this will be what the texture gets displayed on?
  gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0,  0.0,
    1.0,  0.0,
    0.0,  1.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

# Answer

No, buffers, programs, attributes, renderbuffers, framebuffers, textures and texture units are independent from programs

Uniforms are program specific
