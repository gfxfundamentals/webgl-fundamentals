Title: WebGL - Directional lighting without texture mapping?
Description:
TOC: qna

# Question:

Does directional lighting affect objects that are NOT textured?
All examples/tutorials i see/read about always have texture mapped objects.

# Answer

No, WebGL does what you program it to do. 

Directional lighting is usually computed as a multiplier (0 = black, 1 = white) and is then multiplied by whatever color you want to output. If that color is a solid color instead of a texture you don't need textures.

But it's up to you to write shaders that use the lighting the way want it to do the calculations and combine the results.
