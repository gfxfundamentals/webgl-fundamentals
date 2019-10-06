Title: What is the difference between glframebuffertexture2d and glTexSubImage2d
Description:
TOC: qna

# Question:

I have already used glTexSubImage2d and I know that it helps in filling images(texture) partly, but can we use [glframebuffertexture2d](https://www.khronos.org/opengles/sdk/docs/man32/html/glFramebufferTexture2D.xhtml)  to increase some performance.
Or simply what is the difference and which one is recommended to use ?

# Answer

`glTexSubImage2D` copies some data to a sub-rectangle of a texture

`glFramebufferTexture2D` attaches a texture to a framebuffer

The 2 functions are completely unrelated and are used for completely different purposes.

A framebuffer is a collection of attachments that you can render to (assuming your gpu/driver supports the combination of attachments you've attached. You can find out if they are supported by making a framebuffer, attaching things to it, then calling `glCheckframebufferStatus`. If it returns `GL_FRAMEBUFFER_COMPLETE` then you can render to that combination of attachments

One you've done that you can render to that framebuffer (effectively rendering into its attachments). Whether that's faster than uploading data is up to you. It really depends on your data. Framebuffers are normally used to generate textures at runtime for things like shadows, environment maps, various data for post processing effects, etc...
