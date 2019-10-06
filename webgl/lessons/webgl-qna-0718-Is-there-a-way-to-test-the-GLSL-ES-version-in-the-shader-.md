Title: Is there a way to test the GLSL-ES version in the shader?
Description:
TOC: qna

# Question:

In web tools such as [shadertoy][1], my fragment shader source is included in a main() I don't control or see. It would be the same if I were distributing some GLSL library.

My problem is ensuring compatibility between webGL2 and 1: I would like to write GLSL fallbacks to emulate missing webGL2 built-in if the browser or OS is only WebGL1 capable.
->
Is there a way to test the current webGL/GLSL version from the shader, as we do for the availability of extension ?

( BTW, testing extensions is getting complicated now that some are included in the language: e.g., GL_EXT_shader_texture_lod is undefined in webGL2 despite the function is there. So being able to test the GLSL version is crucial.)


  [1]: http://shadertoy.com

# Answer

AFAICT there's no good way to test. The spec says the preprocessor macro `__VERSION__` will be set to the version as in integer `300` for GLSL version 3.00 so

    #if __VERSION__ == 300
       // use 300 es stuff
    #else  
       // use 100 es tuff
    #endif


The problem is for WebGL2 when using 300 es shaders the very first line of the shader must be 

     #version 300 es

So you can't do this

     #if IMAGINARY_WEBGL2_FLAG
         #version 300 es         // BAD!! This has to be the first line
         ...
     #else 
         ...
     #

So, given that you already have to have update the first line why not just have 2 shaders, one for WebGL1, another for WebGL2. Otherwise all major engines generate their shaders so it should be pretty trivial to generate WebGL1 or WebGL2 in your code if you want to go down that path.

In the first place, there's no reason to use WebGL2 shader features if you can get by with WebGl1 and if you are using WebGL2 features then they're not really the same shader anymore are they? They'd need different setup, different inputs, etc...

Let's pretend we could do it all in GLSL though, what would you want it to look like?

     // IMAGINARY WHAT IF EXAMPLE ....

     #if WEBGL2
       #version 300 es
       #define texture2D texture
       #define textureCube texture
     #else
       #define in varying
       #define out varying
     #endif

     in vec4 position;
     in vec2 texcoord;

     out vec2 v_texcoord;

     uniform sampler2D u_tex;
     uniform mat4 u_matrix;

     void main() {
        gl_Position = u_matrix * (position + texture2D(u_tex, texcoord));
        v_texcoord = texcoord;
     }

Let's assume you wanted to do that. You could do in JavaScript (not suggesting this way, just showing an example)

     const webgl2Header = `#version 300 es
       #define texture2D texture
       #define textureCube texture
     `;
     const webglHeader = `
       #define in varying
       #define out varying
     `;

     function prepShader(gl, source) {
       const isWebGL2 = gl.texImage3D !== undefined
       const header = isWebGL2 ? webgl2Header : webglHeader;
       return header + source;
     }

     const vs = `
     in vec4 position;
     in vec2 texcoord;

     out vec2 v_texcoord;

     uniform sampler2D u_tex;
     uniform mat4 u_matrix;

     void main() {
        gl_Position = u_matrix * (position + texture2D(u_tex, texcoord));
        v_texcoord = texcoord;
     }
     `;

     const vsSrc = prepSource(gl, vs);

You can make your JavaScript substitutions as complicated as you want. For example [this library](https://github.com/stackgl/glslify)

