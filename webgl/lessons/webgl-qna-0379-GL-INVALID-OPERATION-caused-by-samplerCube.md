Title: GL_INVALID_OPERATION caused by samplerCube
Description:
TOC: qna

# Question:

I am currently learning WebGL, and expanding my code with something new every time. However, this error keeps throwing:

    [.WebGLRenderingContext-0111BCC8]GL ERROR :GL_INVALID_OPERATION : glFramebufferTexture2D: <- error from previous GL command

In my javascript code, I set a `uniform bool`, whether the object I'm rendering has reflection or not (earlier in my render-code I've created a cubemap and rendered the reflection to it). When it has reflection, I also set the active texture unit, bind the cubemap texture and set the `uniform textureCube uReflectionMap`, like below:

    if (obj.reflects && obj.reflectionMap != null) {
        this.gl.activeTexture(this.gl.TEXTURE10);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, obj.reflectionMap.glTexture);
        this.gl.uniform1i(p.uniforms["uReflectionMap"], 10);
        this.gl.uniform1i(p.uniforms["uReflects"], true);
    } else {
        this.gl.uniform1i(p.uniforms["uReflects"], false);
    }

**I'm using texture unit 10 only for this part of the code (only for the reflection cubemaps)**

The fragment-shader code:

    if(uReflects){
        vec3 lookup = reflect(eyeDirection, normal);
        color += textureCube(uReflectionMap, -lookup); //no errors when this line is commented
    }

When I comment the 'highlighted' line above, everything works fine (except that there is no reflection obviously). Thus, I expected the `if(uReflects)` to be wrong (so that this piece of code exectutes even when there is no uReflectionMap set. Simply changed the commented line to `color += vec4(1.)`, and only the objects which I've set to reflect were completely white.

What I tried thereafter, which fixed the problem, is setting the `uReflectionMap` to texture unit 10 (`this.gl.uniform1i(p.uniforms["uReflectionMap"], 10);` in the else statement), regardless of whether my object has a reflectionMap.

This to me seems weird, because the textureCube function isn't executed when uReflects is false, but still generates errors when uReflectionMap is not set.

I hope the question is understandable, I have a lot of code and have no idea what I should add to the question (because perhaps something else is interfering, which I've overseen).

I've done all this testing in Google Chrome 43.0.2357.134 m. Just ran it in IE, and it seems to give a more elaborated error message, though it's such poorly written Dutch that I have no idea how to interpret it, not to mention translate. <strike>Will try firefox now.</strike>Firefox doesn't give any warnings, but it doesn't work either...

<hr />
**Response @gman:**

This is the code where I create the cubemap texture ():

 var texture = gl.createTexture();
 gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
 gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 
 gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
 
 
 var size = 1024;
 
 this.reflectionFrameBuffers = [];
 this.reflectionRenderBuffers = [];
 
 for (var i = 0; i < 6; i++) {
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  
  this.reflectionRenderBuffers[i] = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, this.reflectionRenderBuffers[i]);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);
 
 
  this.reflectionFrameBuffers[i] = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.reflectionFrameBuffers[i]);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.reflectionRenderBuffers[i]);
  
  gl.checkFramebufferStatus(gl.FRAMEBUFFER);//this throws no errors
 }
 
 gl.bindTexture(gl.TEXTURE_2D, null);
 gl.bindFramebuffer(gl.FRAMEBUFFER, null);
 gl.bindRenderbuffer(gl.RENDERBUFFER, null);

This piece clears all the sides before rendering:

 this.gl.colorMask(true, true, true, true);
 this.gl.clearColor(0, 0, 0, 1);
 this.gl.cullFace(this.gl.BACK);

 for (var j = 0; j < 6; j++) {
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, obj.reflectionFrameBuffers[j]);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
 }

This is the code for rendering to the cubemap (it is surrounded by other for-loops and code to feed the reflectionMapper shader):

 for (var k = 0; k < 6; k++) {
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, obj.reflectionFrameBuffers[k]);
  this.gl.uniformMatrix4fv(p.uniforms["uViewMatrix"], false, obj.reflectionViewMatrices[k].array);//these view matrices determine which direction to look in
  this.gl.drawArrays(this.gl.TRIANGLES, 0, mesh.facesArray.length / 9);
 }

# Answer

The issue is you have 2 uniform samplers of different types pointing to the same texture unit.

Shaders generally execute all paths. What I mean is if you have this in your shader

    if (someCondition) {
      a = value1;
    } else {
      a = value2;
    }

What really happens in the shader is something like

    a = value1 * (someCondition ? 1 : 0) + value2 * (someCondition ? 0 : 1);

or better yet

    // mix will be 1.0 if someCondition is true, else 0.0
    float mix = step(0.5, 1.0 - float(someCondition)); 

    a = value1 * mix + value2 * (1 - mix);

Now there are no branches. GPUs don't branch, that's how they get their speed. Note I made that example up but it shows the point that both value1 and value2 are used regardless of the condition. That assumes the condition is variable. In your example


    uniform bool uIsCube;
    uniform sampler2D uTwoD;
    uniform samplerCube uCube;
    
    varying vec3 vTexCoord;
    
    void main(void){
        if(uIsCube){
            gl_FragColor = textureCube(uCube, vTexCoord);
        } else {
            gl_FragColor = texture2D(uTwoD, vTexCoord.st);
        }
    }

`uIsCube` is variable. I can't be known at compile time, only runtime, so both `uCube` and `uTwoD` are used always and need to be set to different texture units using `gl.uniform1i`

If on the other hand if the condition was a constant like this

    #define IsCube false

    void main(void){
        if(IsCube){
            gl_FragColor = textureCube(uCube, vTexCoord);
        } else {
            gl_FragColor = texture2D(uTwoD, vTexCoord.st);
        }
    }

Then at compile time the compiler would *possibly* remove one of the samplers. I say *possibly* because IIRC the spec doesn't require a driver to optimize away unused code in the shader.

Also note that uniforms all default to 0 so if you don't set the uniforms then both samplers will be pointing to texture unit .

You can check if a uniform was optimized away by checking for its location

    var uCubeLoc = gl.getUniformLocation(program, "uCube");
    if (!uCubeLoc) {
      // uCubeLoc does not exist or was optimized out
    }

To see if there's an error in your code related to multiple samplers of different types pointing to the same texture unit you could a call to a function like this just before each `gl.draw___` call.

    function checkForConflictingSamplers() {
      var prg = gl.getParameter(gl.CURRENT_PROGRAM);
      var units = {};
      var numUniforms = gl.getProgramParameter(prg, gl.ACTIVE_UNIFORMS);
      
      function checkUniform(name, type) {
        var unit = gl.getUniform(prg, gl.getUniformLocation(prg, name));
        var unitInfo = units[unit];
        if (unitInfo === undefined) {
          units[unit] = { 
            type: type,
            name: name,
          };
        } else if (unitInfo.type !== type) {
          console.error("unit " + unit + " is being used by conflicting samplers " + name + " and " + unitInfo.name);
        }
      }    
    
      for (var ii = 0; ii < numUniforms; ++ii) {
        var uniformInfo = gl.getActiveUniform(prg, ii);
        if (!uniformInfo) {
          continue;
        }
        var name = uniformInfo.name;
        var type = uniformInfo.type;
        var isArray = (uniformInfo.size > 1 && name.substr(-3) === "[0]");
        // remove the array suffix.
        if (name.substr(-3) === "[0]") {
          name = name.substr(0, name.length - 3);
        }
        
        if (type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) {
          if (isArray) {
            for (var ii = 0; ii < uniformInfo.size; ++ii) {
              checkUniform(name + "[" + ii + "]", type);
            }
          } else {
            checkUniform(name, type);
          }
        }
      }
    }


