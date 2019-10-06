Title: Cannot initialize a vector array with an integer index in WebGL/GLSL?
Description:
TOC: qna

# Question:

I'm wondering why I can't initialize an array with an integer index. In shadertoy it seems to work but it doesn't work when I use this pixel shader via three.js:

    void main(void) {
     vec2 p[1];
     p[0] = vec2(0.0, 0.0); // works

     int i = 0;
     p[i] = vec2(0.0, 0.0); // doesn't work glsl doesn't run

     gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }

Any ideas?

# Answer

The issue is GLSL 1.0 only supports **constant** integer expressions for array axis or loops based on **constant** integer expressions.

[See the spec](https://www.khronos.org/registry/OpenGL/specs/es/2.0/GLSL_ES_Specification_1.00.pdf#page=115)

```
void main(void) {
    vec2 p[1];
    p[0] = vec2(0.0, 0.0); // works

    int i = 0;
    p[i] = vec2(0.0, 0.0); // doesn't work. i is not constant

    const int j = 0;
    p[j] = vec2(0.0, 0.0); // works

    vec2 q[2];
    for (int k = 0; k < 2; ++k) {  // 2 is a constant int so this works
       p[k] = vec2(0); // works
    }

    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
```

Note that the rules are complex. For example your code is ok in a vertex shader but not in a fragment shader. Except for arrays of samplers even in vertex shaders the index must follow the same restricted rules.

WebGL2 supports GLSL ES 3.00 which allows non-constant integer array access in more places.

Shadertoy optionally uses WebGL2 though it tries to do it auto-magically. You don't have to tell it your shader is using GLSL ES 3.0, it just guesses some how. Maybe it compiles the shader both ways and whichever one works is the one it uses. I have no idea, I just know it does support both. 

[THREE.js has a WebGL2 version](https://threejs.org/docs/#manual/en/introduction/How-to-use-WebGL2)
