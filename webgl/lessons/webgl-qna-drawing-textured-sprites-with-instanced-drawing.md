Title: Drawing textured sprites with instanced drawing
Description: Drawing textured sprites with instanced drawing
TOC: Drawing textured sprites with instanced drawing

## Question:

I try to draw multiple icon on screen and I use drawArraysInstancedANGLE  method. 
I try to use multiple texture like this but some icons draw diffrent geometry, I can not find what draw like that.

I use one big icon map texture and fill icon vertex coord array with this func: 
```
  FillIconTextCoordBuffer(data, mapW, mapH, i) {
    const ULiconW = data.x / mapW
    const ULiconH = data.y / mapH
    const LRiconW = (data.x + data.width) / mapW
    const LRiconH = (data.y + data.height) / mapH
    const { gl } = this.FGlobe

    this.IconMapTexCoordArr[i] = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.IconMapTexCoordArr[i])
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      ULiconW, ULiconH,
      LRiconW, LRiconH,
      LRiconW, ULiconH,
      LRiconW, LRiconH,
      ULiconW, ULiconH,
      ULiconW, LRiconH]), gl.STATIC_DRAW)
  }

```

and then my draw func like this: 
```
  gl.uniform1f(P2DRotationForLayer, icon.rotDeg)
  gl.uniform2fv(P2DScaleLocForLayer, icon.__size)
  gl.uniform4fv(P2DOpacityLocForLayer, __iconColor)

  ext.vertexAttribDivisorANGLE(P2DoffsetForLayer, 1) // This makes it instanced!

  gl.bindBuffer(gl.ARRAY_BUFFER, this.IconMapVertCoordArr)
  gl.enableVertexAttribArray(P2DvertexPosForLayer)
  gl.vertexAttribPointer(P2DvertexPosForLayer, 3, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, this.IconCoordBuff)
  gl.enableVertexAttribArray(P2DoffsetForLayer)
  gl.vertexAttribPointer(P2DoffsetForLayer, 2, gl.FLOAT, false, 0, 0)

  gl.bindTexture(gl.TEXTURE_2D, IconMap[icon.mapIndex].texture)
  gl.disable(gl.BLEND)
  for (var j = this.StartCountArr.length; j--;) {
     this.DrawInstances(this.StartCountArr[j].start, this.StartCountArr[j].count, j)
  }

  ext.vertexAttribDivisorANGLE(P2DoffsetForLayer, 0)

```

and my DrawInstances func like this: 

```
DrawInstances(start, count, j) {
    const {
      gl, ext,
      P2DtextCoordLocForLayer,
    } = this.FGlobe

    gl.bindBuffer(gl.ARRAY_BUFFER, this.IconMapTexCoordArr[j])
    gl.enableVertexAttribArray(P2DtextCoordLocForLayer)
    gl.vertexAttribPointer(P2DtextCoordLocForLayer, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    ext.drawArraysInstancedANGLE(gl.TRIANGLES, start, 6, count)
  }
```

Actually some icons drawed right I see 2 different icon but there is one type more look like this: 

```
|\
| \
|  \
|  /
| /
|/

```


my icons only two triangle like below, I dont set any shape like above,
```
______
|\   |
| \  |
|  \ |
|   \|
------
```




## Answer:

Here's a sample drawing multiple sprites from a sprite sheet using instanced drawing.

Note if it was me I'd use a matrix for each instance [like this example](https://webglfundamentals.org/webgl/lessons/webgl-instanced-drawing.html) but I thought the code would be simpler using offset and scale here.

{{{example url="../webgl-qna-drawing-textured-sprites-with-instanced-drawing-example-1.html"}}}

note I'm not skipping instances but if you want to skip instances then you need to set the offset passed to `gl.vertexAttribPointer` for each instanced attribute. For example in the code above if you wanted to draw instances 7 to 29 it would be

     const numInstancesToSkip = 7;
     const numInstancesToDraw = 29 - 7 + 1;
     const size = 2;  // vec2
     const sizeOfFloat = 4;
     const offset = numInstancesToSkip * sizeOfFloat * size;

     gl.bindBuffer(offsetBuffer);
     gl.vertexAttribPointer(offsetLoc, size, gl.FLOAT, false, 0, offset);
     gl.bindBuffer(scaleBuffer);
     gl.vertexAttribPointer(scaleLoc, size, gl.FLOAT, false, 0, offset);
     gl.bindBuffer(uvOffsetBuffer);
     gl.vertexAttribPointer(uvOffsetLoc, size, gl.FLOAT, false, 0, offset);
     gl.bindBuffer(uvScaleBuffer);
     gl.vertexAttribPointer(uvScaleLoc, size, gl.FLOAT, false, 0, offset);

and to draw would be

     ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, mumInstancesToDraw);

note that `offset` above is the same for each attribute because all the atrributes are the same size (2) and the same type (gl.FLOAT) and they are all in separate buffers so their base offsets are all 0. If they were different sizes or different types or mixed into the same buffer they'd all require different math.
     

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="http://akkayahu.com">H. Akkaya</a>
    from
    <a data-href="https://stackoverflow.com/questions/59662950">here</a>
  </div>
</div>
