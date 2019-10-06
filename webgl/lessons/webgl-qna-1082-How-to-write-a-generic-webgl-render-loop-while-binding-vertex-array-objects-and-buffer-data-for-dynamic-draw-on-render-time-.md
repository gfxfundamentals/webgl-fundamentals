Title: How to write a generic webgl render loop while binding vertex array objects and buffer data for dynamic draw on render time?
Description:
TOC: qna

# Question:

I want to display text using the mentioned method in [this article](https://webgl2fundamentals.org/webgl/lessons/webgl-text-glyphs.html). Meanwhile I care about code to be generic.

In the article it mentions manually creating a buffer info which I call first method :

      // Maunally create a bufferInfo
      var textBufferInfo = {
        attribs: {
          a_position: { buffer: gl.createBuffer(), numComponents: 2, },
          a_texcoord: { buffer: gl.createBuffer(), numComponents: 2, },
        },
        numElements: 0,
      };
      var textVAO = twgl.createVAOFromBufferInfo(
          gl, textProgramInfo, textBufferInfo);


and setup render using:

      // update the buffers
      textBufferInfo.attribs.a_position.numComponents = 2;
      gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_position.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.position, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_texcoord.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.texcoord, gl.DYNAMIC_DRAW);

opposed to this second method:

      // Create data for 'F'
      var fBufferInfo = twgl.primitives.create3DFBufferInfo(gl);
      var fVAO = twgl.createVAOFromBufferInfo(
          gl, fProgramInfo, fBufferInfo);

and setup render: 

        // setup the attributes and buffers for the F
        gl.bindVertexArray(fVAO);


So I thought this means, on initialization time, I can setup a VAO like this:

      const makeVao = (bufferInfos) => {
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
    
        bufferInfos.forEach(({
          array,
          size,
          index
        }) => {
    
          let buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
    
          gl.enableVertexAttribArray(index);
          gl.vertexAttribPointer(index,
                                 size,
                                 gl.FLOAT,
                                 false,
                                 0,
                                 0);
    
        });
    
        gl.bindVertexArray(null);
    
        return vao;
      };

With `bufferInfos` usage:

    let bufferInfos = [{
      array: [vertices],
      size: 2,
      index: gl.getAttribLocation(program, name) 
    }];

This will setup attributes and give me a VAO that I can use at render time like:

    gl.bindVertexArray(vao);

then I am done. 


Except, I want the first method, where I can set vertices attributes on each render. So how do I set up the generic code to be able to set shader attributes on render time?

# Answer

Since you're using vertex array objects you only need to setup attributes at init time. Attributes keep a pointer to the buffer that was current when `vertexAttribPointer` was called. See [this article on attribute state](https://webgl2fundamentals.org/webgl/lessons/webgl-attributes.html) or [this question](https://stackoverflow.com/a/28641368/128511) or [this one](https://stackoverflow.com/questions/27148273/what-is-the-logic-of-binding-buffers-in-webgl/27164577)

In other words if you do this

```
// assume positionLoc = 0, normalLoc = 1, texcoordLoc = 2

gl.bindVertexArray(someVAO);

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLoc, ...);
gl.enableVertexAttribArray(positionLoc);

gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.vertexAttribPointer(normalLoc, ...);
gl.enableVertexAttribArray(texcoordLoc);

gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.vertexAttribPointer(texcoordLoc, ...);
gl.enableVertexAttribArray(texcoordLoc);
```

Then `someVAO` holds the following state

```
// pseudo code
someVAO = {
  attributes: [
    { enabled: true, buffer: positionBuffer, ... },  // loc = 0
    { enabled: true, buffer: normalBuffer, ... },    // loc = 1
    { enabled: true, buffer: texcoordBuffer, ... },  // loc = 2
    { enabled: false, ... },                         // loc = 3
    ...
  ]
  elementArrayBuffer: null,  
}
```

So anytime you want to update a buffer just

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferToUpdate);
    gl.bindData(gl.ARRAY_BUFFER, newData, gl.???_DRAW);

or

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferToUpdate);
    gl.bindSubData(gl.ARRAY_BUFFER, offset, newData);


And anytime you want to render you just

    gl.useProgram(someProgram);
    gl.bindVertexArray(someVAO)
    gl.uniform... // for each uniform
    gl.drawXXX

The only complication is that if you try to use the same vertex array with 2 or more programs you need to make sure the attribute locations match for both programs. You can do that either by assigning locations manually in the vertex shader GLSL

```
#version 300 es
layout(location = 0) in vec4 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 texcoord;
```

Or **before** calling `gl.linkProgram` you can call `gl.bindAttribLocation` as in

```
gl.bindAttribLocation(someProgram, 0, "position");
gl.bindAttribLocation(someProgram, 1, "normal");
gl.bindAttribLocation(someProgram, 2, "texcoord");
gl.linkProgram(someProgram);
```

I prefer the second method is it's more [D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) but the first method is more common I'm only guessing because D.R.Y. style programming is also less common than non-D.R.Y.

If you're using twgl to compile your programs you can pass in the locations for it to call `bindAttribLocation` for you

```
const programOptions = {
  attribLocations: {
    'position': 0,
    'normal':   1,
    'texcoord': 2,
    'color':    3,
  },
};
const programInfo1 = twgl.createProgramInfo(gl, [vs1, fs1], programOptions);
const programInfo2 = twgl.createProgramInfo(gl, [vs2, fs2], programOptions);
```

As for your code, the only issue I can see with your `makeVAO` function is you're not storing `buffer` for each attribute anywhere so you have no easy way to call `gl.bindBuffer(gl.ARRAY_BUFFER, theBufferToUpdate)` when you want to try to update a buffer. Otherwise, at a glance, your `makeVAO` function looks fine.

you could for example do this

```
  const makeVao = (bufferInfos) => {
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    bufferInfos.forEach((bufferInfo) => {
      const {
          array,
          size,
          index
        } = bufferInfo;
      const buffer = gl.createBuffer();
      bufferInfo.buffer = buffer;         // remember the buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);

      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(index,
                             size,
                             gl.FLOAT,
                             false,
                             0,
                             0);

    });

    gl.bindVertexArray(null);

    return vao;
  };
```

and now you could use

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfos[0].buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, newData);

To update the first buffer.
