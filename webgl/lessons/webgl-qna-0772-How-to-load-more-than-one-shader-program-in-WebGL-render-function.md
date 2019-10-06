Title: How to load more than one shader program in WebGL render function
Description:
TOC: qna

# Question:

Could anyone possibly help me with the following, I'm quite stuck and would appreciate any advice. I'll try to be as terse as possible.

I have a simple WebGL page which renders two objects. I can load one shader program or another at the click of a button to change the way in which these two objects are rendered. However, I want to render one object with the first shader program and the other object with the second shader program.

Here's my drawing function (called each time the user drags the mouse):

    WebGLViewer.prototype.DrawGLScene = function()
    {
        this.SetupWebGLContextViewport();
    
        this.SetForProgram();
       
        this.Draw3DObjects();
    }

So, three functions are called. Here they are:

Firstly set the projection and camera:

    WebGLViewer.prototype.SetupWebGLContextViewport = function()
    {
        this.m_WebGLContext.viewport(0, 0, this.m_WebGLContext.viewportWidth, this.m_WebGLContext.viewportHeight);
        this.m_WebGLContext.clear(this.m_WebGLContext.COLOR_BUFFER_BIT | this.m_WebGLContext.DEPTH_BUFFER_BIT);
    
        if(this.m_projection == PROJECTION.ORTHOGRAPHIC)
        {
            mat4.ortho(this.m_orthoXMin, this.m_orthoXMax, this.m_orthoYMin, this.m_orthoYMax, 0.1, 100, this.m_pMatrix);
        }
        else
        {
            mat4.perspective(45, this.m_WebGLContext.viewportWidth / this.m_WebGLContext.viewportHeight, 0.1, 100.0, this.m_pMatrix);
        }
        
        mat4.identity(this.m_mvMatrix);
      
     this.m_mvMatrix = mat4.lookAt(this.m_eye, this.m_centre, this.m_up);
    }

Secondly, choose which shader program to use (if there is only one object then use program 0 otherwise program 1 - I add the objects one at a time with a button click) - (I should add that m_arrProgramSettingCallbacks is an array of two functions which set the values of the vertex and fragment shader uniform variables):

    WebGLViewer.prototype.SetForProgram = function()
    {
        if(this.m_numObjects.length == 1)
        {
            this.UseShaderProgram(0,false);
        }
        else
        {
            this.UseShaderProgram(1,false);
        }
    
        this.m_WebGLContext.uniformMatrix4fv(this.m_shaderProgram.m_pMatrixUniform, false, this.m_pMatrix);
     this.m_WebGLContext.uniformMatrix4fv(this.m_shaderProgram.m_mvMatrixUniform, false, this.m_mvMatrix);
       
     var normalMatrix = mat3.create();
     mat4.toInverseMat3(this.m_mvMatrix, normalMatrix);
     mat3.transpose(normalMatrix);
     this.m_WebGLContext.uniformMatrix3fv(this.m_shaderProgram.m_nMatrixUniform, false, normalMatrix);
         
     this.m_WebGLContext.useProgram(this.m_shaderProgram);
        
        var context = this.m_nShaderProgramID == 0 ? this : this.m_callingObject;
        this.m_arrProgramSettingCallbacks[this.m_nShaderProgramID].call(context);
    }

You can see that the above function calls another function called UseShaderProgram which simply sets the global variables m_nShaderProgramID and m_shaderProgram as follows (I pass false as the second argument so no redraw takes place):

    WebGLViewer.prototype.UseShaderProgram = function(nShaderProgramID, bRedraw)
    {
        this.EnableVertexAttribArray(nShaderProgramID);
    
        this.m_nShaderProgramID = nShaderProgramID;
        this.m_shaderProgram = this.m_arrShaderPrograms[this.m_nShaderProgramID];
    
        if(bRedraw)
        {
            this.Draw();
        }
    }

Finally, the third function renders the scene:

    WebGLViewer.prototype.Draw3DObjects = function()
    {
        this.m_WebGLContext.activeTexture(this.m_WebGLContext.TEXTURE0);
       
        for(var n3DObject = 0; n3DObject < this.m_arrVertexPositionBuffers.length; n3DObject++)
        {
            this.m_preRenderObjectCallback.call(this.m_callingObject, n3DObject);
    
         this.m_WebGLContext.bindBuffer(this.m_WebGLContext.ARRAY_BUFFER, this.m_arrVertexPositionBuffers[n3DObject]);
         this.m_WebGLContext.vertexAttribPointer(this.m_shaderProgram.m_vertexPositionAttribute, this.m_arrVertexPositionBuffers[n3DObject].itemSize, this.m_WebGLContext.FLOAT, false, 0, 0);
       
         this.m_WebGLContext.bindBuffer(this.m_WebGLContext.ARRAY_BUFFER, this.m_arrVertexNormalBuffers[n3DObject]);
         this.m_WebGLContext.vertexAttribPointer(this.m_shaderProgram.m_vertexNormalAttribute, this.m_arrVertexNormalBuffers[n3DObject].itemSize, this.m_WebGLContext.FLOAT, false, 0, 0);
       
         this.m_WebGLContext.bindBuffer(this.m_WebGLContext.ARRAY_BUFFER, this.m_arrVertexColourBuffers[n3DObject]);
         this.m_WebGLContext.vertexAttribPointer(this.m_shaderProgram.m_vertexColourAttribute, this.m_arrVertexColourBuffers[n3DObject].itemSize, this.m_WebGLContext.FLOAT, false, 0, 0);
       
         this.m_WebGLContext.bindBuffer(this.m_WebGLContext.ARRAY_BUFFER, this.m_arrVertexTextureCoordBuffers[n3DObject]);
         this.m_WebGLContext.vertexAttribPointer(this.m_shaderProgram.m_textureCoordAttribute, this.m_arrVertexTextureCoordBuffers[n3DObject].itemSize, this.m_WebGLContext.FLOAT, false, 0, 0);
    
            this.m_WebGLContext.bindBuffer(this.m_WebGLContext.ELEMENT_ARRAY_BUFFER, this.m_arrVertexIndicesBuffers[n3DObject]);
            this.m_WebGLContext.drawElements(this.m_WebGLContext.TRIANGLES, this.m_arrVertexIndicesBuffers[n3DObject].numItems, this.m_WebGLContext.UNSIGNED_SHORT, 0);
       }
    }

So, one can see that in any given run of the rendering code only one shader program is used, depending on whether there are one or two objects.

This is all working perfectly.

Hoping to get one shader program used per object I basically put the call to SetForProgram inside the the Draw3DObjects function as below:

    WebGLViewer.prototype.Draw3DObjects = function()
    {
        this.m_WebGLContext.activeTexture(this.m_WebGLContext.TEXTURE0);
       
        for(var n3DObject = 0; n3DObject < this.m_arrVertexPositionBuffers.length; n3DObject++)
        {
            this.UseShaderProgram(n3DObject,false);
    
            this.m_WebGLContext.uniformMatrix4fv(this.m_shaderProgram.m_pMatrixUniform, false, this.m_pMatrix);
         this.m_WebGLContext.uniformMatrix4fv(this.m_shaderProgram.m_mvMatrixUniform, false, this.m_mvMatrix);
       
         var normalMatrix = mat3.create();
         mat4.toInverseMat3(this.m_mvMatrix, normalMatrix);
         mat3.transpose(normalMatrix);
         this.m_WebGLContext.uniformMatrix3fv(this.m_shaderProgram.m_nMatrixUniform, false, normalMatrix);
         
         this.m_WebGLContext.useProgram(this.m_shaderProgram);
        
            var context = this.m_nShaderProgramID == 0 ? this : this.m_callingObject;
            this.m_arrProgramSettingCallbacks[this.m_nShaderProgramID].call(context);
    
            this.m_preRenderObjectCallback.call(this.m_callingObject, n3DObject);
    
         this.m_WebGLContext.bindBuffer(this.m_WebGLContext.ARRAY_BUFFER, this.m_arrVertexPositionBuffers[n3DObject]);
         this.m_WebGLContext.vertexAttribPointer(this.m_shaderProgram.m_vertexPositionAttribute, this.m_arrVertexPositionBuffers[n3DObject].itemSize, this.m_WebGLContext.FLOAT, false, 0, 0);
       
         this.m_WebGLContext.bindBuffer(this.m_WebGLContext.ARRAY_BUFFER, this.m_arrVertexNormalBuffers[n3DObject]);
         this.m_WebGLContext.vertexAttribPointer(this.m_shaderProgram.m_vertexNormalAttribute, this.m_arrVertexNormalBuffers[n3DObject].itemSize, this.m_WebGLContext.FLOAT, false, 0, 0);
       
         this.m_WebGLContext.bindBuffer(this.m_WebGLContext.ARRAY_BUFFER, this.m_arrVertexColourBuffers[n3DObject]);
         this.m_WebGLContext.vertexAttribPointer(this.m_shaderProgram.m_vertexColourAttribute, this.m_arrVertexColourBuffers[n3DObject].itemSize, this.m_WebGLContext.FLOAT, false, 0, 0);
       
         this.m_WebGLContext.bindBuffer(this.m_WebGLContext.ARRAY_BUFFER, this.m_arrVertexTextureCoordBuffers[n3DObject]);
         this.m_WebGLContext.vertexAttribPointer(this.m_shaderProgram.m_textureCoordAttribute, this.m_arrVertexTextureCoordBuffers[n3DObject].itemSize, this.m_WebGLContext.FLOAT, false, 0, 0);
    
            this.m_WebGLContext.bindBuffer(this.m_WebGLContext.ELEMENT_ARRAY_BUFFER, this.m_arrVertexIndicesBuffers[n3DObject]);
            this.m_WebGLContext.drawElements(this.m_WebGLContext.TRIANGLES, this.m_arrVertexIndicesBuffers[n3DObject].numItems, this.m_WebGLContext.UNSIGNED_SHORT, 0);
       }
    }

Works fine when there is only one object, but when I add the second the program stops responding.

Well, sorry for all the code. Thanks to anyone who can advise me about using the useProgram function per object in an OpenGL rendering loop.

Mitch.

# Answer

Some things you should be aware of.

1. Uniform locations are not shared across programs.

   If you have 2 programs that both have a uniform called `u_matrix` you need to look up separate location objects for each program

2. Attribute locations are not guaranteed to be the same

   Unless you call `gl.bindAttribLocation` (webgl1 and webgl2) or use `layout (location = <loc>)` (webgl2 glsl 300 es) then attribute locations can/will be different for each program.

So the short of that is, when you want to switch programs you need to enable and setup the attributes for that specific program (unless you used the methods above to make sure they use the same attribute locations), and, you need to set all the uniforms for that specific program because uniforms are not shared. 

Also remember that the `gl.uniform???` functions work on the current program, the one you set with `gl.useProgram`. So, in order to set uniforms on a particular program you must first call `gl.useProgram` for that program.

You should see errors in the JavaScript console for using the wrong uniform locations with the wrong program. Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl");

    const vs = createShader(gl, gl.VERTEX_SHADER, `
    void main() { 
      gl_Position = vec4(0,0,0,1); 
      gl_PointSize = 10.;
    }
    `);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }
    `);

    // create 2 programs using the exact same shaders
    const prg1 = createProgram(gl, vs, fs);
    const prg2 = createProgram(gl, vs, fs);

    // look up the location of 'color' on prg1
    const colorLoc = gl.getUniformLocation(prg1, "color");
    // use that location with prg2  BAD!!
    gl.useProgram(prg2);
    gl.uniform4fv(colorLoc, [1, 0, 0, 1]);  // SHOULD GET ERROR


    function createProgram(gl, vs, fs) {
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      // TODO: check for errors;
      return p;
    }

    function createShader(gl, type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      // TODO: should check for errors
      return s;
    }

<!-- end snippet -->

When I run the code above I see this in the JavaScript console

>        WebGL: INVALID_OPERATION: uniform4fv: location is not from current program

Looking at your code I see this 

        this.UseShaderProgram(n3DObject,false);

        this.m_WebGLContext.uniformMatrix4fv(this.m_shaderProgram.m_pMatrixUniform, false, this.m_pMatrix);
        this.m_WebGLContext.uniformMatrix4fv(this.m_shaderProgram.m_mvMatrixUniform, false, this.m_mvMatrix);

        var normalMatrix = mat3.create();
        mat4.toInverseMat3(this.m_mvMatrix, normalMatrix);
        mat3.transpose(normalMatrix);
        this.m_WebGLContext.uniformMatrix3fv(this.m_shaderProgram.m_nMatrixUniform, false, normalMatrix);

        this.m_WebGLContext.useProgram(this.m_shaderProgram);


The code is calling `this.UseShaderProgram` but that is not calling `useProgram`. It's then setting uniforms on whatever program was previously made current. Finally it calls `useProgram` but at that point it's too late.
