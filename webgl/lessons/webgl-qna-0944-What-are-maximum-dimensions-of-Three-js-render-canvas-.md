Title: What are maximum dimensions of Three.js render canvas?
Description:
TOC: qna

# Question:

When I set render canvas size to ~4000x4000px it's ok, however starting from around 4000 (tested 5k, 6k, 8k) it seems that scene is "cut off" in some way. See image below:

[![enter image description here][1]][1]

So up to ~4k content is properly rendered in the center of canvas and for higher canvas sizes it cuts the content. 

1. Is it a Three.js/WebGL limitation? 
2. If yes then what are actual maximum canvas dimensions that don't cause any "deformations"?
3. Is there anything I can do about it? I need to get canvas snapshot in high resolution (8k).


  [1]: https://i.stack.imgur.com/Ka7us.png

# Answer

> Is there anything I can do about it? I need to get canvas snapshot in high resolution (8k).

You can render portions of the scene using [`Camera.setViewOffset`](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera.setViewOffset) and then assemble the parts into a large image.

Here's library that does this

https://greggman.github.io/dekapng/

I know there is an answer here I wrote that shows how to do this in three.js since I wrote that library because of my answer. Unfortunately 10 minutes of searching didn't bring up >:(

