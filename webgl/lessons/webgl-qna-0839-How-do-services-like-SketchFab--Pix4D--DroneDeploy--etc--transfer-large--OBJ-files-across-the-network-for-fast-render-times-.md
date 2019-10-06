Title: How do services like SketchFab, Pix4D, DroneDeploy, etc. transfer large .OBJ files across the network for fast render times?
Description:
TOC: qna

# Question:

I've seen 3D viewer services like SketchFab, Pix4D, DroneDeploy, etc. be able to send large 3D models over a network with really quick rendering times. For example, I download the model from Pix4D directly and I see that the file is roughly 70mb which takes a considerable amount of time to serve over a network.

However, when I visit sites like SketchFab, Pix4D, etc. they only take a few seconds. It looks like they are optimizing these files somehow without losing any of the vertices (accuracy) of these models.

Any thoughts on how to serve large assets in 3D applications?

# Answer

they don't download those formats. they download custom formats designed for perf and download speed.

for example 

https://github.com/google/draco/

I haven't looked into the details but [glTF](https://github.com/KhronosGroup/glTF) also claims to be a designed to be a display format (a format optimized for displaying in real time) where as other formats like .obj, .dae, .fbx, .3ds, .mb, etc are all either editing formats or formats designed to change data between editors, not for displaying.

