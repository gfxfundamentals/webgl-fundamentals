Title: Does a texture with data and a texture with no data consume the same amount of memory?
Description:
TOC: qna

# Question:

In my application I create textures, render to them and delay reading from them until absolutely needed by the CPU.

I'd like to know (and I still don't know how) given that I guess and monitor the consumed GPU memory would the call to `readPixels()` alleviate the memory consumption of the GPU by transferring data to the CPU? Or would that memory still be occupied until I destroy the texture?

# Answer

`readPixels` just copies the data. It does not remove it from the GPU.

Textures that you don't pass data to (you passed `null`) take the same amount of memory as textures you pass no data to. The browser just fills the texture with zeros for you.

The only way for a texture to stop using memory is for you to delete it with `gl.deleteTexture`. You also need to remove every reference to it (unbind it from any texture units it's still on and remove it from any framebuffer attachments or delete the framebuffer's it's attached to).
