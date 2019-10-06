Title: webgl getUniformLocation returns 0
Description:
TOC: qna

# Question:

Put succinctly, I've hit the problem where calls for different uniforms via getUniformLocation all seem to return the same value.

It's hard to validate this since the returned Glint is opaque to the javascript console. However when looking at someone else's code sample I noticed you can pass standard javascript numbers in it's place hence this trial code:

    const infoA = gl.getActiveUniform(program, gl.getUniformLocation(program, 'uSampler'));
    const infoB = gl.getActiveUniform(program, gl.getUniformLocation(program, 'uRotationMatrix'));
    const infoC = gl.getActiveUniform(program, 0);
    const infoD = gl.getActiveUniform(program, 1);

`infoA` and `infoB` both equal the `WebGLActiveInfo` object for the `'uRotationMatrix'` uniform, as does `infoC`, but `infoD`returns the info data for `'uSampler'`.

The closest I can find to similar questions is about optimization removing unused uniforms resulting in getUniformLocation always returning -1. I don't believe that is the case here, since both uniforms are used and using the webgl-inspector chrome extension by Ben Vanik https://github.com/benvanik/WebGL-Inspector , I see both uniforms listed in the Program panel with idx values 0 and 1. However I did note that providing an invalid uniform name produced no error and resulted in a 'default' return value of an info object for `'uRotationMatrix'` (`infoE`); using just `-1`resulted in an error (`infoF`).

    const infoE = gl.getActiveUniform(program, gl.getUniformLocation(program, 'INVALID_NAME');
    const infoF = gl.getActiveUniform(program, -1); // null

Interestingly the results in Safari are reversed, that is the majority of calls return the info object for `'uSampler`' while only explicitly using a javascript number, returns the info object for `'uRotationMatrix'`

The shaders are below and pretty simple, both they and the program I linked them in returned success when the relevant paramters were inspected. i.e.

    gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    gl.getProgramParameter(program, gl.LINK_STATUS);
    
Vertex.

    precision mediump float;

    attribute vec2 aPosition;
    attribute vec2 aTexCoord;

    uniform mat4 uRotationMatrix;

    varying vec2 fragTexCoord;

    void main() {

      fragTexCoord = aTexCoord;

      gl_Position = uRotationMatrix * vec4(aPosition, 0.0, 1.0);
    }

Fragment.

    precision mediump float;

    varying vec2 fragTexCoord;
    uniform sampler2D uSampler;
 
    void main() {

  
      vec4 sample = texture2D(uSampler, fragTexCoord);

      gl_FragColor = vec4(sample.rgb, 1.0);
    }

Does anyone have any pointers for where I should be looking to track down the problem?

Edit:

In reference to making sure the parameter type and return value types are compatible, via the MDN documentation for the pertinent functions.

"location: A GLuint specifying the index of the uniform attribute to get. ***This value is returned by getUniformLocation***()."  Link: [getActiveUniform](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform)

and 

"Return value: A WebGLUniformLocation value indicating the location of the named variable, ... The WebGLUniformLocation type is compatible with the GLint type when specifying the index or location of a uniform attribute." Link: [getUniformLocation](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getUniformLocation)

# Answer

`gl.getUniformLocation` does not return -1 for non-existent uniforms. It returns `null`

This code makes no sense

    const infoA = gl.getActiveUniform(program, gl.getUniformLocation(program, 'uSampler'));
    const infoB = gl.getActiveUniform(program, gl.getUniformLocation(program, 'uRotationMatrix'));

`gl.getActiveUniform` requires an integer. `gl.getUniformLocation` returns `WebGLUniformLocation` object, not an integer and it cannot be converted into a integer. At best it's getting converted into `NaN` and `NaN` is getting converted into 0.

`gl.getActiveUniform` does not take uniform locations, it takes a number from 0 to N - 1 where N is returned from `gl.getProgramParameter(prg, gl.ACTIVE_UNIFORMS)`. It's purpose is to allow you to query the uniforms without first knowing their names.

    const numUniforms = gl.getProgramParameter(prg, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; ++i) {
      // get the name, type, and size of a uniform
      const info = gl.getActiveUniform(prg, i);
      // get the location of that uinform
      const loc = gl.getUniformLocation(prg, info.name);
    }

Note that the reason WebGL choose to have `gl.getUniformLocation` return a `WebGLUniformLocation` object instead of an int is because it's an common error to guess those ints or to assume they are consecutive. OpenGL makes no such guarantees. 

* Two programs with the same uniforms might have different locations for each uniform. 
* Those locations are not 0 and 1, they could be anything, 5323 and 23424. It's up to the driver. Various drivers return different numbers. 
* Similarly for uniforms arrays like `uniform float foo[2]`, if the location of `foo[0]` is 37 that does **not** mean the location of `foo[1]` is 38.  

For all these reasons WebGL chose to wrap the location. That way many of those mistakes can be avoided and/or checked for. You can't do math on a `WebGLUniformLocation` so the guessing a location error disappears (your guess might work locally but you're making a webpage that has to run on other GPUs). The erroneous uniform array math error is avoided. Similarly you can't use a `WebGLUniformLocation` from one program with a different program meaning the error of assuming 2 programs with the same uniforms will have the same int locations for those uniforms is avoided. 

While we're on the topic of `gl.getActiveUniform` you should be aware it can return info for things that aren't uniforms. Example: https://jsfiddle.net/greggman/n6mzz6jv/
