Title: How are layout qualifiers better than getAttribLocation in WebGL2?
Description:
TOC: qna

# Question:

As I'm learning more about WebGL2, I've come across this new syntax within shaders where you set `location` inside of shaders via: `layout (location=0) in vec4 a_Position;`. How does this compare to getting the `attribute` location with the traditional `gl.getAttribLocation('a_Position');`. I assume it's faster? Any other reasons? Also, is it better to set locations to integers or would you be able to use strings as well?


# Answer

There are 2 ideas conflated here

1. Manually assigning locations to attributes
2. Assigning attribute locations in GLSL vs JavaScript

## Why would you want to assign locations?

1. You don't have to look up the location then since you already know it
2. You want to make sure 2 or more shader programs use the same locations so that they can use the same attributes. This also means a single vertex array can be used with both shaders. If you don't assign the attribute location then the shaders may use different attributes for the same data. In other words shaderprogram1 might use attribute 3 for position and shaderprogram2 might use attribute 1 for position.

## Why would you want to assign locations in GLSL vs doing it in JavaScript?

You can assign a location like this in GLSL

    layout (location=0) in vec4 a_Position;

You can also assign a location in JavaScript like this

    // **BEFORE** calling gl.linkProgram
    gl.bindAttribLocation(program, 0, "a_Position");

Off the top of my head it seems like doing it in JavaScript is more DRY (Don't repeat yourself). In fact if you use consistent naming then you can likely set all locations for all shaders by just binding locations for your common names before calling `gl.linkProgram`. One other minor advantage to doing it in JavaScript is it's compatible with GLSL ES 1.0 and WebGL1.

I have a feeling though it's more common to do it in GLSL. That seems bad to me because if you ever ran into a conflict you might have to edit 10s or 100s of shaders. For example you start with

    layout (location=0) in vec4 a_Position;
    layout (location=1) in vec2 a_Texcoord;

Later in another shader that doesn't have texcoord but has normals you do this

    layout (location=0) in vec4 a_Position;
    layout (location=1) in vec3 a_Normal;
    
Then sometime much later you add a shader that needs all 3

    layout (location=0) in vec4 a_Position;
    layout (location=1) in vec2 a_Texcoord;
    layout (location=2) in vec3 a_Normal;

If you want to be able to use all 3 shaders with the same data you'd have to go edit the first 2 shaders. If you'd used the JavaScript way you wouldn't have to edit any shaders.

Of course another way would be to generate your shaders which is common. You could then either inject the locations 


    const someShader = `
    layout (location=$POSITION_LOC) in vec4 a_Position;
    layout (location=$NORMAL_LOC) in vec2 a_Texcoord;
    layout (location=$TEXCOORD_LOC) in vec3 a_Normal;
    ...
    `;

    const substitutions = {
      POSITION_LOC: 0,
      NORMAL_LOC: 1,
      TEXCOORD_LOC: 2,
    };
    const subRE = /\$([A-Z0-9_]+)/ig;
  
    function replaceStuff(subs, str) {
      return str.replace(subRE, (match, group0) => {
        return subs[group0];
      });
    }

    ...

    gl.shaderSource(prog, replaceStuff(substitutions, someShader));


or inject preprocessor macros to define them.

    const commonHeader = `
    #define A_POSITION_LOC 0
    #define A_NORMAL_LOC 1
    #define A_TEXCOORD_LOC 2
    `;

    const someShader = `
    layout (location=A_POSITION_LOC) in vec4 a_Position;
    layout (location=A_NORMAL_LOC) in vec2 a_Texcoord;
    layout (location=A_TEXCOORD_LOC) in vec3 a_Normal;
    ...
    `;

    gl.shaderSource(prog, commonHeader + someShader);

Is it faster? Yes but probably not much, not calling `gl.getAttribLocation` is faster than calling it but you should generally only be calling `gl.getAttribLocation` at init time so it won't affect rendering speed and you generally only use the locations at init time when setting up vertex arrays.

> is it better to set locations to integers or would you be able to use strings as well?

Locations are integers. You're manually choosing which attribute index to use. As above you can use substitutions, shader generation, preprocessor macros, etc... to convert some type of string into an integer but they need to be integers ultimately and they need to be in range of the number of attributes your GPU supports. You can't pick an arbitrary integer like 9127. Only 0 to N - 1 where N is the value returned by `gl.getParameter(MAX_VERTEX_ATTRIBS)`. Note N will always be >= 16 in WebGL2
