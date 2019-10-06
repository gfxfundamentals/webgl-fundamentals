Title: Error in GLSL program - WebGL
Description:
TOC: qna

# Question:

I was trying to pass an **uniform** variable from my JavaScript code to GSLS program. But I am getting this warning, for which my expected output is not coming: 

    WebGL: INVALID_OPERATION: uniform3fv: location is not from current program 

There is how I have initialised the uniform value from my JavaScript code:

    var lights = {
        direction: [1.0, 1.0, 1.0],
        color: [0.0, 1.0, 1.0]
    };

    var u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
    var u_LightDirection = gl.getUniformLocation(program, 'u_LightDirection');

    if (u_LightColor < 0) {
        console.error("failed to get the storage location u_LightColor");
    }

    if (u_LightDirection < 0) {
        console.error("failed to get the storage location u_LightDirection");
    }

    gl.uniform3fv(u_LightColor, lights.color);
    gl.uniform3fv(u_LightDirection, lights.direction);

My fragment-shader code is like this:

    precision mediump float;
        uniform vec3 u_LightColor;
        uniform vec3 u_LightDirection;
        uniform sampler2D diffuseMap;
        varying mediump vec3 color;
        varying vec2 tCoord;
        varying vec3 n;
        void main(void) {

            vec3 normal = normalize(n);
            float nDotL = max(dot(normalize(vec3(-5.0, -0.0, -5.0)), normal), 0.0);
            diffuseVal = (u_LightColor) * diffuseVal * nDotL;
            gl_FragColor = vec4(diffuseVal, 1.0);
        }

I don't know why I am getting this warning. Although the program is running but the values of `u_LightColor` or `u_LightDirection` is not passing into fragment-shader; as a result output is all dark. 

Also to point out, I have other `uniform` variable in the GLSL program in which data is passed using uniformSetter function; and those are working fine. 

Can someone help me know, why data is not coming in `u_LightColor` or `u_LightDirection`?

# Answer

Did you call `gl.useProgram(program)` before calling `gl.uniform3fv`?

Uniforms are program specific. In other words if I make 2 shader programs, even if they use exactly the same source, the locations that are looked up for them are not sharable.

Example: given these functions which always use the same source.

     function makeShader(type, source) {
        var s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        return s;
     }

     function makeProgram() {
        var vs = makeShader(gl.VERTEX_SHADER, vertexShaderSource);
        var fs = makeShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        var prg = gl.createProgram();
        gl.attachShader(vs);
        gl.attachShader(fs);
        gl.linkShader(prg);
        return prg;
     }    

This code will generate an error

     var prg1 = makeProgram();
     var prg2 = makeProgram();
     var u_someUniformLocation = gl.getUniformLocation(prg1, "u_someUniform");

     gl.useProgram(prg2);
     gl.uniform3fv(u_someUniformLocation, [1,2,3]);  // ERROR!

`u_someUniformLocation` is for `prg1` not `prg2` even though the shader programs are the same they are separate programs and have require separate `WebGLUniformLocation` objects.



