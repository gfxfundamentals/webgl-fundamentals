Title: Three.js method for adding high resolution textures for planets
Description:
TOC: qna

# Question:

So I found out that texturing planets can be really hard. I created a 4096k image and wrapped it around a high poly sphere. Apart from the possible memory management performance issue that comes with a 3-4 mb image, the texture looks bad / pixelated on a close up (orbital) view. 

I was thinking that I could maybe increase the resolution significantly by splitting up the picture. Then create a low, medium and high version of each section. If the camera viewport is very close to that particular section then render the high resolution image. If far away remove image from memory and apply low or medium version.


[![enter image description here][1]][1]

  [1]: http://i.stack.imgur.com/rKm98.jpg


To be honest I am not sure what strategy to use to render high quality planets. Should I maybe avoid textures and just use height maps and color the planet with Javascript? Same thing for the clouds. Should I create a sphere with an alpha map or should I use shaders?

As you can see this is the issue im having and hopefully you could enlighten me. Performance with Webgl / three.js has significantly improved over time but since this is all done within the browser I assume thinking about the right solution is vital in the long term. 

# Answer

You're going to need to implement a lod system. lod = "level of detail" and in 3d it means generally means switching from high-polygon to low-polygon models but in general it means doing anything to switch high detail to low-detail

Because you can't make textures 1000000x100000 which is pretty much what you'd need to do to get the results you want you'll need build a sphere out of multiple sections and texture each one separately. How many sections depends on how close you want to be able to zoom in. Google Maps has millions of sections. At the same time, if you can zoom out to see the whole planet (like you can in Google Maps) you can't draw millions of sections. Instead you'd switch to a single sphere. That process is called ["LODing"](https://en.wikipedia.org/wiki/Level_of_detail)

There is no "generic" solution. You generally need to write your own for your specific case.

In the case of something like Google Maps what they most likely do is have several levels of detail. A single sphere when you can see the whole planet. A sphere made of say 100 pieces when slightly closer. A sphere made of 1000 pieces when closer, A sphere made of 10000 pieces when closer, etc etc. They also only show the pieces you can see. Deciding and managing which pieces to show with a generic solution would be way to slow (look at millions of pieces every frame) but you, as the application writer know what pieces are visible so you can make sure only those pieces are in your scene.

Another thing that people often do is fade between LODs. So when Google Maps is showing the single mesh sphere when all the say zoomed out and they transition to the 100 piece or 1000 piece sphere they crossfade between the two.

Some examples of lodding 

http://acko.net/blog/making-worlds-1-of-spheres-and-cubes/

http://vterrain.org/LOD/spherical.html


