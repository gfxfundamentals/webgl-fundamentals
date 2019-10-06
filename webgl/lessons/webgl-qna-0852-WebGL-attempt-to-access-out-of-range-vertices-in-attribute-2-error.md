Title: WebGL attempt to access out of range vertices in attribute 2 error
Description:
TOC: qna

# Question:

I know this question has been asked quite a bit, but none of the solutions really fit my case. I am looking to add a second type of object to the canvas with the code shown below. I know I didn't provide much but its a quick start. Just ask for more if you think you have a hunch. This code below is in my render function. 

So far I have checked that

 1. I have enough vertices in my points array
 2. I have enough normal vectors in my normals array
 3. I have enough texture coordinates in my texCoords array
 4. There are no mismatches between the vectors added when creating my terrain and my propeller. 

The terrain renders just fine with the texture, lighting and all but,I am unable to get the propeller to render. I get the error I listed above. I have added multiple objects to canvases before and never run into an error like this.

    //----------------------------------------- Draw Terrain ------------------------------------
      var i = 0;
      for(var row=0-dimension; row<dimension; row+=3){
     for(var col=0-dimension; col<dimension; col+=3, i++){
       var mv = mult(viewer, mult(translate(row, -1, col), mult(scale[i],rot[i])));
          gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv));
       gl.uniformMatrix3fv(normalLoc, false, flatten(normalMatrix(mv, true)));
          gl.drawArrays( gl.TRIANGLES, 0, index);
     }
      }
    
      //----------------------------------------- Draw Propeller ------------------------------------
      mv = mult(viewer, mult( translate(-2.1, -2.9, -.2), scalem(4,5,5)));
      gl.uniformMatrix4fv(modelViewLoc, false, flatten(mv));
      gl.uniformMatrix3fv(normalLoc, false, flatten(normalMatrix(mv, true)));
      gl.drawArrays( gl.TRIANGLES, propellerStart, points.length);

Is there any way i can use the "Attribute 2" in the error message to track down the variable giving me this issue?

Appreciate the help!

# Answer

What part don't you understand? The error is clear, whatever buffer you have attached to attribute 2 is not big enough to handle the `propellerStart, points.length` draw request.

So first thing is figure out which attribute is attribute 2. Do this by printing out your attribute locations. Is your points, normals, or texcoords?

You should already be looking them up somewhere with `gl.getAttribLocation` so print out those values, find out which one is #2.

Then go look at the size of the buffer you attached to that attribute. To do that somewhere you would have called. 

    gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer);
    gl.vertexAttribPointer(locationForAttribute2, size, type, normalize, stride, offset);

So we know it's `someBuffer` from the above code. We also need to know `size`, `type`, `stride`, and `offset`

Somewhere else you filled that buffer with data using

    gl.bindBuffer(gl.ARRAEY_BUFFER, someBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, someData, ...);

So you need to find the size of someData.

    sizeOfBuffer = someData.length * someData.BYTES_PER_ELEMENT

Let's it's a 1000 element `Float32Array` so it someData.length is 1000 and `someData.BYTES_PER_ELEMENT` is 4 therefore `sizeOfBuffer` is 4000.

Using all of that you can now check if your buffer is too small. (note: we already know it's too small since the browser told us so but if you want know how to compute it yourself)

Let's say `size` is 3, `type` is `gl.FLOAT`, `stride` is 32, `offset` is 12 (note: I personally never use anything but stride = 0 and offset = 0)

Let's say `points.length = 50`

    numPoints = points.length;
    bytesPerElement = size * 4;   // because a gl.FLOAT is 4 bytes
    realStride = stride === 0 ? bytesPerElement : stride;
    bytesNeeded = realStride * (numPoints - 1) + bytesPerElement;

`bytesNeeded` in this case is (64 * 49) + 12 = 3148

So now we know how many bytes are needed. Does are buffer have enough data? We'll when you called draw you passed in an offset `propellerStart`. Let's assume it's 900 and there's the `offset` in the attribute so.

    bufferSizeNeeded = offset + propellerStart + bytesNeeded

so `bufferSizeNeeded = 12 + 900 + 3148` which is 4060. Since 4060 is > `sizeOfBuffer` which was 4000 you're going to get the error you got.

In any case the point is really it's up to you to figure out which buffer is used by attribute #2, then go look at why your buffer is too small. Is your offset to drawArrays wrong? Is your stride too big? Is your offset wrong in vertexAttribPointer (it's in number of bytes not number of units). Do you put the wrong size (1,2,3,4). Do you mis-calculate the number of points?
