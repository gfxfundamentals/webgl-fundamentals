Title: WebGL Texture Loading Results In (Javascript) TypeError
Description:
TOC: qna

# Question:

I am trying to develop an Object-Orientated WebGL engine and I am receiving a Type Error when I implement texture support.

I am referencing this tutorial [here][1]. I have spent about 5 hours rewriting this from scratch again (in attempt to solve the error) and nothing seems to be working.

Full source in this gist: https://gist.github.com/tsujp/a57664ae963c0b510d45

## I am receiving the following error: ##
-----

    [Error] TypeError: Type error
     drawScene (gule.js, line 951)
     render (gule.js, line 856)
     render (main.js, line 291)
     tick (main.js, line 278)
     init (main.js, line 18)

Line in question is: `_gl.bindBuffer( _gl.TEXTURE_2D, currentObject.TEXTURE.IMAGE );`

**Note:** gule.js is the 'compiled' file which is made up of the subfiles (and more) listed below.



Here is the output of the related objects at run-time:
-----

    [OUTPUT FOR OBJECT cube_2]
    Object
    COLOUR_INFO: Object
    INDEX_BUFFER: WebGLBuffer
    NO_CORNERS: 8
    NO_FACES: 6
    POINT_ITEM_ARRAY: Float32Array[72]
    POINT_ITEM_SIZE: 3
    POINT_NUM_ITEMS: 24
    POSITION_BUFFER: WebGLBuffer
    TEXTURE: Object
        IMAGE: WebGLTexture
        SOURCE: "textures/texture_1.gif"
        WRAP_ITEM_ARRAY: Float32Array[48]
        WRAP_ITEM_SIZE: 2
        WRAP_NUM_ITEMS: 24
        __proto__: Object
    TEXTURE_BUFFER: WebGLBuffer
    VERT_ITEM_ARRAY: Uint16Array[36]
    VERT_ITEM_SIZE: 1
    VERT_NUM_ITEMS: 36
    children: Array[0]
    id: 2
    name: "Cube 2"
    parent: Object
    uuid: "f25a4d62-1e7f-4d8f-82b1-76cef29e708f"
    __proto__: Object


I don't understand why I would be receiving a type error if I am constructing it exactly the same as in the tutorial. Below is a 'short' trace of how the texture is constructed.

`main.js`
-----

      // I want some textures instead
      texture = new GULE.Texture( "textures/texture_1.gif" );
    
      // Define wrapping
      var texture_wrap = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    
        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
    
        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
    
        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
    
        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
    
        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
      ];
    
      // Set wrap
      texture.setWrap( texture_wrap, 24 );
    
      // Set the cubes texture to be this "texture"
      cube_2.defineTexture( texture );

`cube.js`
-----

    GULE.Cube.prototype.defineTexture = function ( texture ) {
    
      this.TEXTURE = texture;
    
    };

    GULE.Cube.prototype.initialiseTextures = function ( context, program ) {
    
      this.TEXTURE._createTexture( context );
    
      context.bindTexture( context.TEXTURE_2D, this.TEXTURE.IMAGE );
      context.pixelStorei( context.UNPACK_FLIP_Y_WEBGL, true );
      context.texImage2D( context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, this.TEXTURE.IMAGE.image );
      context.texParameteri( context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST );
      context.texParameteri( context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST );
      context.bindTexture( context.TEXTURE_2D, null );
    
    };

`texture.js`
-----

      setWrap: function ( wrap, numItems ) {
    
        this.WRAP_ITEM_ARRAY = new Float32Array( wrap );
        this.WRAP_NUM_ITEMS = numItems;
    
      },

      _createTexture: function ( context ) {
    
        this.IMAGE = context.createTexture();
        this.IMAGE.image = new Image();
        this.IMAGE.image.src = this.SOURCE;
    
      }


`scene_renderer.js` (inside rendering loop)
-----

            _gl.bindBuffer( _gl.ARRAY_BUFFER, currentObject.TEXTURE_BUFFER );
            _gl.vertexAttribPointer( _program.textureCoordAttribute, currentObject.TEXTURE.WRAP_ITEM_SIZE, _gl.FLOAT, false, 0, 0 );
    
            _gl.activeTexture( _gl.TEXTURE0 );
            _gl.bindBuffer( _gl.TEXTURE_2D, currentObject.TEXTURE.IMAGE );
            _gl.uniform1i( _program.samplerUniform, 0 );

  [1]: http://learningwebgl.com/blog/?p=507

# Answer

`gl.bindBuffer` does not take textures. You're passing it a `WebGLTexture`. It only takes `WebGLBuffers`. Hence the type error. You're also calling it with `gl.TEXTURE_2D` which will end up generating a `gl.INVALID_ENUM` once you fix the type error.

I suspect you wanted to call `gl.bindTexture`?
