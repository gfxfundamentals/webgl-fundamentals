Title: WebGL shader checking status of texture sampler2D
Description:
TOC: qna

# Question:

I want to have prepared shader component (for multi sampler tex) 

In my current state i use (activate and bind) only 2 texture image.
 
But this line :
 

    gl_FragColor = textureColor + textureColor1 + textureColor2;


Makes trouble with my texture view as the texture I sample textureColor2 from is not bound.

In shaders its not possible to use console.log or any other standard debugging methods.I am interested to learn more about shaders but i am stuck. 


Code : 

...

    precision mediump float;
    
    varying vec2 vTextureCoord;
    varying vec3 vLightWeighting;
    
    uniform sampler2D uSampler;
    uniform sampler2D uSampler1;
    uniform sampler2D uSampler2;
    uniform sampler2D uSampler3;
    uniform sampler2D uSampler4;
    uniform sampler2D uSampler5;
    uniform sampler2D uSampler6;
    uniform sampler2D uSampler7;
    uniform sampler2D uSampler8;
    uniform sampler2D uSampler9;
    uniform sampler2D uSampler10;
    uniform sampler2D uSampler11;
    uniform sampler2D uSampler12;
    uniform sampler2D uSampler13;
    
    
    void main(void) {
    
    
    vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    vec4 textureColor1 = texture2D(uSampler1, vec2(vTextureCoord.s, vTextureCoord.t));
    vec4 textureColor2 = texture2D(uSampler2, vec2(vTextureCoord.s, vTextureCoord.t));
 
    // Need help here
    gl_FragColor = textureColor + textureColor1 ;

    //gl_FragColor = textureColor + textureColor1 + textureColor2;
     

**//UPDATED QUESTION**


        if (  ${numTextures} == 1)
            {
                gl_FragColor = textureColor;
            }
        else if (${numTextures} == 2)
            {
                gl_FragColor = textureColor + textureColor1;
            }
        else if (${numTextures} == 3)
            {
                gl_FragColor = textureColor + textureColor1 + textureColor2;
            }

// i use simple pragmatic if else for now .

// i pass value to the shader on load

// i still cant update shader in run time  


///////////////////////////////////////

// This is segment of draw function : 

 
    for (var t=0;t<object.textures.length;t++) {
    
     eval( "  world.GL.gl.activeTexture(world.GL.gl.TEXTURE"+t+");  " )
        world.GL.gl.bindTexture(world.GL.gl.TEXTURE_2D, object.textures[t]);
        world.GL.gl.pixelStorei(world.GL.gl.UNPACK_FLIP_Y_WEBGL, false);
        world.GL.gl.texParameteri(world.GL.gl.TEXTURE_2D, world.GL.gl.TEXTURE_MAG_FILTER, world.GL.gl.NEAREST);
        world.GL.gl.texParameteri(world.GL.gl.TEXTURE_2D, world.GL.gl.TEXTURE_MIN_FILTER, world.GL.gl.NEAREST);
        world.GL.gl.texParameteri(world.GL.gl.TEXTURE_2D, world.GL.gl.TEXTURE_WRAP_S, world.GL.gl.CLAMP_TO_EDGE);
        world.GL.gl.texParameteri(world.GL.gl.TEXTURE_2D, world.GL.gl.TEXTURE_WRAP_T, world.GL.gl.CLAMP_TO_EDGE);
        // -- Allocate storage for the texture
        //world.GL.gl.texStorage2D(world.GL.gl.TEXTURE_2D, 1, world.GL.gl.RGB8, 512, 512);
        //world.GL.gl.texSubImage2D(world.GL.gl.TEXTURE_2D, 0, 0, 0, world.GL.gl.RGB, world.GL.gl.UNSIGNED_BYTE, image);
        //world.GL.gl.generateMipmap(world.GL.gl.TEXTURE_2D);
        world.GL.gl.uniform1i(object.shaderProgram.samplerUniform, t);
        
    }
  



...

Maybe in run time best way is to manipulate with object.textures array ?!

 - Finally : 

   - Override shader with new flag 
   - Compile shader 
     New material is updated 
   

# Answer

What are you trying to accomplish?

The *normal* way to use lots of textures is to use a [*texture atlas*](https://en.wikipedia.org/wiki/Texture_atlas) which is covered toward the bottom of [this article](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html)

Otherwise, no there is no way to detect if a texture is loaded in the shader. You need to pass in your own flags. For example

     uniform bool textureLoaded[NUM_TEXTURES];

or

     uniform float textureMixAmount[NUM_TEXTURES];

I'd use a texture atlas though if I were you unless you really know you're doing something unique that actually needs 14 textures.

It's also common to generate shaders on the fly. Pretty much all game engines do this. Three.js does it as well. So rather than turn textures on and off, write some code that generates a shader for N textures. Then when you only have one texture generate a 1 texture shader, when you have 2 generate a 2 texture shader, etc. That's far more efficient for the GPU than having a 14 texture shader and trying to turn off 13 textures.

Example: 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // note, I'm not recommending this shader, only showing some code
    // that generates a shader

    function generateShaderSrc(numTextures) {

      return `
        // shader for ${numTextures} textures
        precision mediump float;
        
        varying vec2 vTextureCoord;
        varying vec3 vLightWeighting;

        uniform sampler2D uSampler[${numTextures}];
        uniform float uMixAmount[${numTextures}];
        
        void main() {
          vec4 color = vec4(0);

          for (int i = 0; i < ${numTextures}; ++i) {
            vec4 texColor = texture2D(uSampler[i], vTextureCoord);
            color = mix(color, texColor, uMixAmount[i]);
          }
          
          gl_FragColor = color;
        }
      `;
    }

    log(generateShaderSrc(1));
    log(generateShaderSrc(4));

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- end snippet -->

That's a pretty simple example. Real shader generators often do a whole lot more string manipulation. 

You should also be aware WebGL 1.0 only requires support for 8 texture units. [According to webglstats about 15% of devices only support 8 texture units](http://webglstats.com/webgl/parameter/MAX_TEXTURE_IMAGE_UNITS) so you probably want to check how many texture units the user has and warn them your app is not going to work if they have less than your app needs.

