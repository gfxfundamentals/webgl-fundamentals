Title: WebGl rotate texture within the shader
Description:
TOC: qna

# Question:

I'm using webgl to bind a matte image to a regular image. The matte image gives the regular image transparency. 

I was able to successfully upload both images as textures, but when I run the program my color texture and matte texture don't line up. As you can see in the picture below the black should be all gone, but instead it seems scaled and flipped.

[![enter image description here][1]][1]

I find that very strange as both the "color" channel and the "alpha" channel are using the same texture. 

My question is how can I rotate/resize the alpha chanel within the shader? Or will I have to make a new texture coordinate plane to map the alpha channel onto.

For reference this is my code below:


    vertexShaderScript = [
      'attribute vec4 vertexPos;',
      'attribute vec4 texturePos;',
      'varying vec2 textureCoord;',

      'void main()',
      '{',
      '  gl_Position = vertexPos;',
      '  textureCoord = texturePos.xy;',
      '}'
    ].join('\n');

    fragmentShaderScript = [
      'precision highp float;',
      'varying highp vec2 textureCoord;',
      'uniform sampler2D ySampler;',
      'uniform sampler2D uSampler;',
      'uniform sampler2D vSampler;',
      'uniform sampler2D aSampler;',
      'uniform mat4 YUV2RGB;',

      'void main(void) {',
      '  highp float y = texture2D(ySampler,  textureCoord).r;',
      '  highp float u = texture2D(uSampler,  textureCoord).r;',
      '  highp float v = texture2D(vSampler,  textureCoord).r;',
      '  highp float a = texture2D(aSampler,  textureCoord).r;',
      '  gl_FragColor = vec4(y, u, v, a);',
      '}'
    ].join('\n');


  [1]: https://i.stack.imgur.com/Zgs3J.jpg

# Answer

If all you want to do is flip the alpha texture coordinate

    const vertexShaderScript = `
      attribute vec4 vertexPos;
      attribute vec4 texturePos;
      varying vec2 textureCoord;
    
      void main()
      {
        gl_Position = vertexPos;
        textureCoord = texturePos.xy;
      }
    `;
    
    const fragmentShaderScript = `
      precision highp float;
      varying highp vec2 textureCoord;
      uniform sampler2D ySampler;
      uniform sampler2D uSampler;
      uniform sampler2D vSampler;
      uniform sampler2D aSampler;
      uniform mat4 YUV2RGB;
    
      void main(void) {
        highp float y = texture2D(ySampler,  textureCoord).r;
        highp float u = texture2D(uSampler,  textureCoord).r;
        highp float v = texture2D(vSampler,  textureCoord).r;
        highp float a = texture2D(aSampler,  vec2(textureCoord.x, 1. - textureCoord.y).r;
        gl_FragColor = vec4(y, u, v, a);
      }
    `;

But in the general case it's up to you to decide how to supply or generate texture coordinates. You can manipulate them anyway you want. It's kind of asking how do I make the value 3 and I can answer 3, 1 + 1 + 1, 2 + 1, 5 - 2, 15 / 5, 300 / 100,  7 * 30 / 70, 4 ** 2 - (3 * 4 + 1)

The most generic way to change texture coordinates is to multiply them by a matrix just like positions

     uniform mat3 texMatrix;
     attribute vec2 texCoords;

     ... 

     vec2 newTexCoords = (texMatrix * vec3(texCoords, 1)).xy;

And then using the same type of matrix math you'd use for positions for texture coordinates instead.

[This article](https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html) gives some examples of manipulating texture cooridinates by a texture matrix
