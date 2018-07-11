Title: WebGL Debugging
Description: Tips for debugging WebGL

Check the JS console

Set the color to a solid color

Change the background color

Render a Point

Render with gl.clear and or gl.scissor

If Image
  use 1x1 pixel
  use canvas
  use dataURL and pngcrush
  use imgur (not stack.imgur)

Render texcoords
Render normals


Make an MCVE
  don't CSS
  don't resize

consider logging with

  function log(...)

not important for yourself but often important for others who will either forgot to or not
not no to look at console.

use HTML overlay (should be obvious)
use Clearing HTML overlay

use URL to pass in parameters

use WebgL_Debug_shaders
override any part of webgl
Use a debug context

