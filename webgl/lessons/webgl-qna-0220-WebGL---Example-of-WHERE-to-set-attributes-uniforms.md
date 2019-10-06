Title: WebGL - Example of WHERE to set attributes/uniforms
Description:
TOC: qna

# Question:

I have seen several examples/tutorials of WebGL where the gl.getAttributeLocation() or gl.getUniformLocation() and the like are called. However, these are all in a demo/tutorial scenario.

**The issue/concern is this:**
The gl.getAttributeLocation, for example, takes in a string as the 2nd parameter. This is the name of the variable in the shader code.

Example:

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');


To me this seems kind of bad because if i happen to change the shader code slightly (like a variable name), then it might cause all kinds of headaches due to the refactoring i have to do everywhere where the changes variable name is referenced.

I hope I'm getting my concern across. Please let me know if this is not clear and i will try to elaborate some more.

**Question:**
I'm a beginner Opengl-ES/WebGL programmer, so I know i must be missing something. What do experienced programmers do to associate variable names in the shader code with their application code?

Thanks. 



# Answer

I think your concern might be misplaced. You're saying if you change the shader's uniform and/or attribute names you might have to change the code the uses them. How is that any different than any other part of programming? If I make an object

    Animal = function(height, weight, numLegs) {
      this.height = height;
      this.weight = weight;
      this.numLegs = numLegs;
    }

And I have code that uses that

    var a = new Animal(1, 150, 4);
    console.log(a.numLegs);

Then later I change Animal

    Animal = function(height, weight, numLegs) {
      this.heightInFeet = height;
      this.weightInLbs = weight;
      this.numberOfLegs = numLegs;
    }

The code I wrote above, `console.log(a.numLegs);`, also has to be changed. 

In other words the issue of changing a name in GLSL and having to change code in other places is not unique to WebGL and in fact is one of the most common things in programming.

As for how people organize things I don't know what most people do. I've done it like this:

Assuming you have a valid linked program I iterate over the locations and uniforms and create an object that has pre-made setters. I can then pass that object a javascript object with name/value pairs that match the shader program.


    function createUniformSetters(program) {

      function createUniformSetter(info) {
        var loc = gl.getUniformLocation(program, info.name);
        var type = info.type;
        if (type == gl.FLOAT)
          return function(v) { gl.uniform1f(loc, v); };
        if (type == gl.FLOAT_VEC2)
          return function(v) { gl.uniform2fv(loc, v); };
        if (type == gl.FLOAT_VEC3)
          return function(v) { gl.uniform3fv(loc, v); };
        if (type == gl.FLOAT_VEC4)
          return function(v) { gl.uniform4fv(loc, v); };
        if (type == gl.INT)
          return function(v) { gl.uniform1i(loc, v); };
        if (type == gl.INT_VEC2)
          return function(v) { gl.uniform2iv(loc, v); };
        if (type == gl.INT_VEC3)
          return function(v) { gl.uniform3iv(loc, v); };
        if (type == gl.INT_VEC4)
          return function(v) { gl.uniform4iv(loc, v); };
        if (type == gl.BOOL)
          return function(v) { gl.uniform1i(loc, v); };
        if (type == gl.BOOL_VEC2)
          return function(v) { gl.uniform2iv(loc, v); };
        if (type == gl.BOOL_VEC3)
          return function(v) { gl.uniform3iv(loc, v); };
        if (type == gl.BOOL_VEC4)
          return function(v) { gl.uniform4iv(loc, v); };
        if (type == gl.FLOAT_MAT2)
          return function(v) { gl.uniformMatrix2fv(loc, false, v); };
        if (type == gl.FLOAT_MAT3)
          return function(v) { gl.uniformMatrix3fv(loc, false, v); };
        if (type == gl.FLOAT_MAT4)
          return function(v) { gl.uniformMatrix4fv(loc, false, v); };
        if (type == gl.SAMPLER_2D || type == gl.SAMPLER_CUBE) {
          return function(unit) {
            return function(v) {
              gl.uniform1i(loc, unit);
              v.bindToUnit(unit);
            };
          }(textureUnit++);
        }
        throw ("unknown type: 0x" + type.toString(16));
      }

      // name to setter object for uniforms
      var uniformSetters = {
      };

      // Look up uniforms
      var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      var textureUnit = 0;

      for (var ii = 0; ii < numUniforms; ++ii) {
        var info = gl.getActiveUniform(program, ii);
        if (!info) {
          break;
        }
        var setter = createUniformSetter(info);
        uniformSetters[info.name] = setter;
      }

      return uniformSetters;
    }

Then I have a function that uses that

    function applyUniforms(uniformSetters, uniforms) {
      for (var name in uniforms) {
        var setter = uniformSetters[name];
        if (setter) {
          setter(uniforms[name]);
        }
      }
    }

So then given a GLSL program like with uniforms like this

    uniform vec2 u_texcoordOffset;
    uniform vec4 u_color;
    uniform float u_multiplier

I can do this at runtime

    // at init time
    var uniformSetters = createUniformSetters(someProgram)

    var uniforms = {
      u_texcoordOffset: [1, 2],
      u_color: [1, 0, 0, 1],
      u_multiplier: 0.56
    };

    // -- at draw time --
    gl.useProgram(someProgram);
    applyUniforms(uniformSetters, uniforms);

I did something similar for attributes.

Note: The above is just pseudo code. It's missing support for arrays, and if it's not
clear textures have been wrapped in some object. [The actual code is here](https://github.com/greggman/tdl).

    
