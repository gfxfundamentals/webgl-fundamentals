Title: Creating Heatmap Over 3D Model From Vector 3 Point Data
Description:
TOC: qna

# Question:

I am attempting to render a flat, dynamically created heatmap on top of a 3D model that is loaded from an OBJ (or STL).

I am currently loading and rendering an OBJ with Three.js. I have vector3 points that I am currently drawing as simple red cubes (image below). These data points are all raycasted to my OBJs mesh and are lying on the surface. The vector3 points are loaded from an external data source and will change depending on what data is being viewed/collected.

  [![points][1]][1]

I would like to render my vector3 point data into a heatmap on the surface of my OBJ. Here are some examples illustrating the type of visual effects I am trying to achieve:

  [![example1][2]][2]

  [![example2][3]][3]

  [![example3][4]][4]

  [![example5][5]][5]

I feel like vertex coloring is the method of achieving this, but my issue is that my OBJ model does not have enough tessellation to do this. As you can see many red dots fall on each face. I am struggling to find a way to draw over my object's mesh with colors exactly where my red point data is. I was assuming I would need to convert my random vector3 points into a mesh, but cannot find a method to do so.

I've looked at the possibility of generating a texture, but 1) I do not have a UV map for my OBJs and do not see a way to programmatically generate them and 2) I am a bit lost on how I would correlate vector3 point data to UV points.

I've looked at using shaders, but my vector3 point data appears to be too large for using a shader (could be hundreds of thousands of points). I also feel it is not the right approach to render the heatmap every frame and would rather only render it once on load.

I've looked into isosurfaces with point clouds and the marching cubes algorithm, but I didn't think this was the right direction since only my data is a bit like a point cloud, and I am unsure as to how I would keep this smooth along the surface of my OBJ mesh.

Although I would prefer to keep everything in JavaScript for viewing in the browser, I am open to doing server side processing in any language/program with REST so long as it can be automated without human intervention, and pushed back to the browser for rendering.

Any suggestions or guidance is appreciated.

  [1]: https://i.stack.imgur.com/Ss8yf.png
  [2]: https://i.stack.imgur.com/nJKgz.png
  [3]: https://i.stack.imgur.com/AzdUQ.jpg
  [4]: https://i.stack.imgur.com/peF0L.jpg
  [5]: https://i.stack.imgur.com/M3P77.jpg

# Answer

I'm only guessing but it seems like first you need to have UV coordinates that map every triangle to a texture. Rather than do this by hand I'd suggest using a modeling package. Most modeling packages have some way of automatically and uniformly mapping every triangle to a texture. [For example in Blender](https://docs.blender.org/manual/ko/dev/editors/uv_image/uv_editing/unwrapping/mapping_types.html#unwrap)

Next to put the heatmap in the texture by computing which triangles are affected by each dot (your raycasting), looking up their texture coordinates, projecting that dot into texture space and then putting the colors in that part of the texture. I'm only guessing that you need to not just do exact points but probably need to consider adjacent triangles since some heat info that hits near the edge of a triangle needs to bleed over into the adjacent triangle but that adjacent triangle might be using a completely different part of the texture.


