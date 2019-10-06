Title: GLSL ES1.0 and passing texture-unit indices to the fragment shader?
Description:
TOC: qna

# Question:

Trying to translate a vertex/frag shader from glsl 330 to glsl es1.0 <br>
(Basically taking a step back since the original app was written for a desktop version of OpenGL3.0, but webGL2.0 is still not fully supported by some browsers, like IE or Safari; to my knowledge).

I understand 1.0 is using **attribute/varying** versus **in/out**, but I am having an issue that I cannot use integers with varying. There is an array of per-vertex integer values representing a texture unit index for that vertex. I do not see a way to convey that information to the fragment shader. If I send the values as floats it will start interpolating. Right ?

    #version 330 //for openGL 3.3
    //VERTEX shader
    //---------------------------------------------------------------------------------
    //uniform variables stay constant for the whole glDraw call
    uniform mat4   ProjViewModelMatrix; 
    uniform mat4   NormalsMatrix;       
    uniform vec4   DefaultColor;        
    uniform vec4   LightColor;          
    uniform vec3   LightPosition;       
    uniform float  LightIntensity;      
    uniform bool   ExcludeFromLight;    
    //---------------------------------------------------------------------------------
    //non-uniform variables get fed per vertex from the buffers
    layout (location=0) in vec3 VertexCoord;  
    layout (location=1) in vec4 VertexColor;  
    layout (location=2) in vec3 VertexNormal; 
    layout (location=3) in vec2 VertexUVcoord;
    layout (location=4) in int  vertexTexUnit;
    //---------------------------------------------------------------------------------
    //Output variables to fragment shader
         out vec4  thisColor;          
         out vec2  vertexUVcoord;
    flat out int   TexUnitIdx;         // <------ PROBLEM
         out float VertLightIntensity; 
    //---------------------------------------------------------------------------------
    
    void main ()
    { /* ... blah ... */ }

The accompanied fragment shader that needs translation looks like this

    #version 330 //for openGL 3.3
    //FRAGMENT shader
    //---------------------------------------------------------------------------------
    //uniform variables
    uniform bool      useTextures;     //If no textures, don't bother reading the TextureUnit array
    uniform vec4      AmbientColor;    //Background illumination
    uniform sampler2D TextureUnit[6];  //Allow up to 6 texture units per draw call
    //---------------------------------------------------------------------------------
    //non-uniform variables
         in  vec2  vertexUVcoord;      
         in  vec4  thisColor;          
    flat in  int   TexUnitIdx;         // <------ PROBLEM
         in  float VertLightIntensity;
    //---------------------------------------------------------------------------------
    //Output color to graphics card
    out vec4 pixelColor;
    //---------------------------------------------------------------------------------
    
    void main ()
    { /* ... blah ... */ }

# Answer

There are no integer based attributes in GLSL ES 1.0

You can pass in floats (and supply as unsigned bytes) of course. Pass in `false` for normalize flag when calling `gl.vertexAttribPointer`

An other hand, neither GLSL ES 1.0 nor GLSL ES 3.00 allow indexing an array of samplers.

From the [spec](https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf)

> # 12.30 Dynamic Indexing
>
> ...
> 
> Indexing of arrays of samplers by constant-index-expressions is supported  in GLSL ES 1.00. A constant-index-expression
> is an expression formed from constant-expressions and certain loop indices, defined for
> a subset of loop constructs. Should this functionality be included in GLSL ES 3.00?
>
> RESOLUTION: No. Arrays of samplers may only be indexed by constant-integral-expressions.

*"Should this functionality be included in GLSL ES 3.00?"* means should *Dynamic indexing* of samplers be included in GLES ES 3.00

I quoted the GLSL ES 3.00 spec since it references the GLSL ES 1.0 spec as well.

So, you have to write code so that your indies are constant-index-expressions.

    attribute float TexUnitNdx;  

    ...

    uniform sampler2D TextureUnit[6];

    vec4 getValueFromSamplerArray(float ndx, vec2 uv) {
      if (ndx < .5) {
       return texture2D(TextureUnit[0], uv);
      } else if (ndx < 1.5) {
       return texture2D(TextureUnit[1], uv);
      } else if (ndx < 2.5) {
       return texture2D(TextureUnit[2], uv);
      } else if (ndx < 3.5) {
       return texture2D(TextureUnit[3], uv);
      } else if (ndx < 4.5) {
       return texture2D(TextureUnit[4], uv);
      } else {
       return texture2D(TextureUnit[5], uv);
      }
    }

    vec4 color = getValueFromSamplerArray(TexUnitNdx, someTexCoord);

or something like that. It might be faster to arrange your ifs into a binary search.
