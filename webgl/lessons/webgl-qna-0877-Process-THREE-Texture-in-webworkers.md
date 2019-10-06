Title: Process THREE.Texture in webworkers
Description:
TOC: qna

# Question:

I would like to process THREE.Texture in web workers to help post processing effects such as bloom. For instance for the bloom effect, I would first draw the scene on a THREE.Texture object and then I would like to handle the blur process in the web worker. What would be the **most efficient** way to pass the THREE.Texture data to the worker and create a new THREE.Texture from the data obtained from the worker. Since I would do that 60 times per second ideally, I need a fast and memory friendly way to do that (memory friendly: not to create new objects in a loop but rather re-use existing objects).

I'm aware that canvas2DContext.getImageData may be helpful but that probably is not the best way since I'd draw to canvas 60 times per second and that would slow things down.

Thanks!

PS: I should specify that in this approach, I don't intend to wait for the worker to finish processing the texture to render the final result. Since most of the objects are static I don't think that would be a big deal anyway. I wanna test it to see how it goes for the dynamic objects though.

# Answer

Passing a GPU based texture to a web worker would not speed up anything in fact it would be significantly slower. 

It's extremely slow to transfer memory from the GPU to the CPU (and CPU to GPU as well) relative to doing everything on the GPU. The only way to pass the contents of a texture to a worker is to ask WebGL to copy from the GPU to the CPU (using `gl.readPixels` on in three whatever it's wrapper for `gl.readPixels` is) and then transfer the result to the worker. Then in the worker all you could do is a slow CPU based blur (slower than it would have been on the GPU), then you'd have to transfer it back to the main thread only to upload it again via `gl.texImage2D` or telling three.js to do it for you which is also a slow operation copying the data from the CPU back to the GPU.

The fast way to apply a blur is to do it on the GPU. 

Further, there is no way to share WebGL resources between the main thread and a worker nor is there likely to be anytime soon. Even if you could share the resource and then from the worker ask the GPU to do the blur that would save no time as well as for the most part GPUs don't run different operations in parallel (not generically multi-process like CPUs) so all you'd end up doing is asking the GPU to do the same amount of work.


