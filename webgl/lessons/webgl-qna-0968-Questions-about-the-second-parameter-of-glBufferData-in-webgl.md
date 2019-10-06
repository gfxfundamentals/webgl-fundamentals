Title: Questions about the second parameter of glBufferData in webgl
Description:
TOC: qna

# Question:

I been reading the famous webgl tutorial https://webgl2fundamentals.org/webgl and learning how to use `bufferData` to put data into the buffer. The tutorial uses `bufferData` in the form like this extensively 

`gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
` 

the second parameter here is the actual array or data we want to send to the buffer on GPU. However I came across this new usage of the API today. 

`    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW);
`

Here the second parameter indicates the size of of the buffer. 

So I was confused by this. I looked this API up on MDN https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData and it says 

    // WebGL1: 
    void gl.bufferData(target, size, usage); 
    void gl.bufferData(target, ArrayBuffer? srcData, usage); 
    void gl.bufferData(target, ArrayBufferView srcData, usage); 
    
    // WebGL2: 
    void gl.bufferData(target, ArrayBufferView srcData, usage, srcOffset, length);

Does this mean for webgl1.0, we can either pass the actual array of data or the size of the buffer to the API as the second parameter. However for WebGL2.0 we can only pass the actual array of data to the API?

I am still not clear on this. Please help.

# Answer

WebGL2 adds to the WebGL1 api so WebGL2 has 4 versions of `gl.bufferData`, the 3 from WebGL1 and one new one.

They are

### set by size

```
void gl.bufferData(target, size, usage); 
```

### set with untyped `ArrayBuffer`

```
void gl.bufferData(target, ArrayBuffer? srcData, usage); 
```

### set with an `ArrayBufferView` like `Uint8Array`, `Float32Array` and the other array buffer view types.

void gl.bufferData(target, ArrayBufferView srcData, usage); 


### set with an `ArrayBufferView` with an offset and length

```
// WebGL2: 
void gl.bufferData(target, ArrayBufferView srcData, usage, srcOffset, length);
```

The last one was added arguably for WebAssembly. The problem was if you had large `ArrayBufferView` and only wanted to upload a portion you had to create a new `ArrayBufferView` on to the same buffer that covered the portion you want to upload. Even though an `ArrayBufferView` on the same `ArrayBuffer` is relatively cheap there's still an allocation for the view which will eventually have to garbage collected. Adding the new version of `gl.bufferData` removes that issue. You don't have to create a temporary `ArrayBufferView` just to upload a portion of an `ArrayBuffer`.

