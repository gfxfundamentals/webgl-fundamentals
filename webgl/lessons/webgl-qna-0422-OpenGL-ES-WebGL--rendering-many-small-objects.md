Title: OpenGL ES(WebGL) rendering many small objects
Description:
TOC: qna

# Question:

I need to render a lot of small objects (2 - 100 triangles in size) which lies in deep hierarchy and each object has its own matrix. In order to render them I precalculate actual matrix for each object, put objects in a single list and I have two calls to draw each object: set matrix uniform and gl.drawElements().

Obviously it is not the fastest way to go. Then I have a few thousand objects performance becomes unacceptable. The only solution I'm thinking about is batch multiple objects into single buffer. But it isn't easy thing to do because each object has its own matrix and to put object into shared buffer I need to transform its vertices by matrix on CPU. Even worse problem is that user can move any objects at any time and I need to recalculate large vertex data again (because user can move object with many nested children)

So I'm looking for alternative approaches. And recently found strange vertex shaders in onshape.com project:

 uniform mat4 uMVMatrix;
 uniform mat3 uNMatrix;
 uniform mat4 uPMatrix;
  
 uniform vec3 uSpecular;
 uniform float uOpacity;
 uniform float uColorAmbientFactor;  //Determines how much of the vertex-specified color to use in the ambient term
 uniform float uColorDiffuseFactor;  //Determines how much of the vertex-specified color to use in the diffuse term
  
 uniform bool uApplyTranslucentAlphaToAll;
 uniform float uTranslucentPassAlpha;
  
 attribute vec3 aVertexPosition;
 attribute vec3 aVertexNormal;
 attribute vec2 aTextureCoordinate;
 attribute vec4 aVertexColor;
  
 varying vec3 vPosition;
 varying lowp vec3 vNormal;
 varying mediump vec2 vTextureCoordinate;
 varying lowp vec3 vAmbient;
 varying lowp vec3 vDiffuse;
 varying lowp vec3 vSpecular;
 varying lowp float vOpacity;
  
 attribute vec4 aOccurrenceId;
  
 float unpackOccurrenceId() {
   return aOccurrenceId.g * 65536.0 + aOccurrenceId.b * 256.0 + aOccurrenceId.a;
 }
  
 float unpackHashedBodyId() {
   return aOccurrenceId.r;
 }
  
 #define USE_OCCURRENCE_TEXTURE 1
  
 #ifdef USE_OCCURRENCE_TEXTURE
  
 uniform sampler2D uOccurrenceDataTexture;
 uniform float uOccurrenceTexelWidth;
 uniform float uOccurrenceTexelHeight;
 #define ELEMENTS_PER_OCCURRENCE 2.0
  
 void getOccurrenceData(out vec4 occurrenceData[2]) {
   // We will extract the occurrence data from the occurrence texture by converting the occurrence id to texture coordinates
  
   // Convert the packed occurrenceId into a single number
   float occurrenceId = unpackOccurrenceId();
  
   // We first determine the row of the texture by dividing by the overall texture width.  Each occurrence
   // has multiple rgba texture entries, so we need to account for each of those entries when determining the
   // element's offset into the buffer.
   float divided = (ELEMENTS_PER_OCCURRENCE * occurrenceId) * uOccurrenceTexelWidth;
   float row = floor(divided);
   vec2 coordinate;
   // The actual coordinate lies between 0 and 1.  We need to take care that coordinate lies on the texel
   // center by offsetting the coordinate by a half texel.
   coordinate.t = (0.5 + row) * uOccurrenceTexelHeight;
   // Figure out the width of one texel in texture space
   // Since we've already done the texture width division, we can figure out the horizontal coordinate
   // by adding a half-texel width to the remainder
   coordinate.s = (divided - row) + 0.5 * uOccurrenceTexelWidth;
   occurrenceData[0] = texture2D(uOccurrenceDataTexture, coordinate);
   // The second piece of texture data will lie in the adjacent column
   coordinate.s += uOccurrenceTexelWidth;
   occurrenceData[1] = texture2D(uOccurrenceDataTexture, coordinate);
 }
  
 #else
  
 attribute vec4 aOccurrenceData0;
 attribute vec4 aOccurrenceData1;
 void getOccurrenceData(out vec4 occurrenceData[2]) {
   occurrenceData[0] = aOccurrenceData0;
   occurrenceData[1] = aOccurrenceData1;
 }
  
 #endif
  
 /**
  * Create a model matrix from the given occurrence data.
  *
  * The method for deriving the rotation matrix from the euler angles is based on this publication:
  * http://www.soi.city.ac.uk/~sbbh653/publications/euler.pdf
  */
 mat4 createModelTransformationFromOccurrenceData(vec4 occurrenceData[2]) {
   float cx = cos(occurrenceData[0].x);
   float sx = sin(occurrenceData[0].x);
   float cy = cos(occurrenceData[0].y);
   float sy = sin(occurrenceData[0].y);
   float cz = cos(occurrenceData[0].z);
   float sz = sin(occurrenceData[0].z);
  
   mat4 modelMatrix = mat4(1.0);
  
   float scale = occurrenceData[0][3];
  
   modelMatrix[0][0] = (cy * cz) * scale;
   modelMatrix[0][1] = (cy * sz) * scale;
   modelMatrix[0][2] = -sy * scale;
  
   modelMatrix[1][0] = (sx * sy * cz - cx * sz) * scale;
   modelMatrix[1][1] = (sx * sy * sz + cx * cz) * scale;
   modelMatrix[1][2] = (sx * cy) * scale;
  
   modelMatrix[2][0] = (cx * sy * cz + sx * sz) * scale;
   modelMatrix[2][1] = (cx * sy * sz - sx * cz) * scale;
   modelMatrix[2][2] = (cx * cy) * scale;
  
   modelMatrix[3].xyz = occurrenceData[1].xyz;
  
   return modelMatrix;
 }
  
  
 void main(void) {
   vec4 occurrenceData[2];
   getOccurrenceData(occurrenceData);
   mat4 modelMatrix = createModelTransformationFromOccurrenceData(occurrenceData);
   mat3 normalMatrix = mat3(modelMatrix);
  
   vec4 position = uMVMatrix * modelMatrix * vec4(aVertexPosition, 1.0);
   vPosition = position.xyz;
   vNormal = uNMatrix * normalMatrix * aVertexNormal;
   vTextureCoordinate = aTextureCoordinate;
  
   vAmbient = uColorAmbientFactor * aVertexColor.rgb;
   vDiffuse = uColorDiffuseFactor * aVertexColor.rgb;
   vSpecular = uSpecular;
   vOpacity = uApplyTranslucentAlphaToAll ? (min(uTranslucentPassAlpha, aVertexColor.a)) : aVertexColor.a;
  
   gl_Position = uPMatrix * position;
 }

It looks like they encode object position and rotation angles as 2 entries in 4-component float texture, add attribute that stores position of each vertex transform in this texture and then perform matrix computation in vertex shader.

So the question is this shader actually effective solution for my problem or I should better use batching or something else?

PS: May be even better approach is to store quaternion instead of angles and transform vertices by it directly?

# Answer

There's [this](https://www.youtube.com/watch?v=rfQ8rKGTVlg) which might give you some ideas.

If understand Rem's comments ...

The simplest solution is to store some kind of per vertex transform data. That is effectively what the video above does. The problem with that solution is if you have a model with 100 vertices you have to update the transforms for all 100 vertices.

The solution is to indirect the transforms through a texture. For each vertex in each model store just a single extra float, we can call this float "modelId" as in

    attribute float modelId;

So all vertices in the first model get id = 0, all vertices in the second model get id = 1, etc.

Then you store your transforms in a texture. For example you might store translation (x, y, z) + a quaternion (x, y, z, w). If your target platform supports floating point textures then that's 2 RGBA pixels per transform.

You use the modelId to compute where in the texture to pull out the transform data.  

    float col = mod(modelId, halfTextureWidth) * 2.;
    float row = floor(modelId / halfTextureWidth);
    float oneHPixel = 1. / textureWidth;
    vec2 uv = vec2((col + 0.5) / textureWidth, (row + 0.5) / textureHeight);
    vec4 translation = texture2D(transforms, uv);
    vec4 rotationQuat = texture2D(transform, uv + vec2(oneHPixel, 0));
 
Now you can use translation and rotationQuat to create a matrix in your vertex shader.

Why `halfTextureWidth`? Because we're doing 2 pixels per transform.

Why `+ 0.5`? See https://stackoverflow.com/a/27439675/128511

This means you only have to update 1 transform per model instead of 1 transform per vertex which makes it the minimum amount of work.

[This example generates some matrices from quaternions](https://www.khronos.org/registry/webgl/sdk/demos/google/particles/index.html). It's kind of a similar idea but since it's doing particles it doesn't need the texture indirection.

Note: The above assume all you need is translation and rotation. There's nothing stopping you from storing whole matrices in the texture if that's what you need. Or anything else for that matter like material properties, lighting properties, etc..

AFAIK pretty much all current platforms support reading data from floating point textures. You have to enable that feature with

    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
       // no floating point textures for you!
    }

But be aware not every platform supports filtering floating point textures. Filtering is not needed for this solution (and would need to be separately enabled). Be sure to set your filtering to `gl.NEAREST`. 
