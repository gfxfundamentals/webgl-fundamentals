Title: Ways of speeding up THREE.js
Description:
TOC: qna

# Question:

I am writing a simple minecraft clone in THREE.js.

However, the result is very laggy.

I am using box geometry for the voxels, but I need to remove blocks when they are broken and need to use mouse picking.

I have heard that joining geometries speeds it up but as far as I am aware, this means that you cannot remove any of the voxels or use mouse picking.

What are the other ways of speeding up in THREE.js?

# Answer

Using a box per voxel (making one draw call per voxel) will be too slow on any machine even if you wrote it in assembly language.

You need to build a mesh for every section of your world. As in divide the world into 48x48x48 unit chunks and build one mesh that contains all the voxels in that area. When the user edits a box you edit the mesh (the vertices) rather than remove a Box object.
