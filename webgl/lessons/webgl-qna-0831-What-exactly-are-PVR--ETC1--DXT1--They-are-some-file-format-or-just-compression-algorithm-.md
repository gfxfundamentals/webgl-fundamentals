Title: What exactly are PVR, ETC1, DXT1. They are some file format or just compression algorithm?
Description:
TOC: qna

# Question:

I always thought these words are just file format that use some special compression method, but recently I find a file format "DDS" that can use DTX1 as the compression method. So I'm curious, if they are all just compression algorithm, do that mean I could for example use DXT1(ETC1, PVR) as compression method to get a PNG image?

# Answer

They are hardward supported binary compression formats (not file formats).

[DXT1, DXT3, DXT5](https://www.khronos.org/opengl/wiki/S3_Texture_Compression#DXT5_Format) are supported on desktop GPUs

[ETC1](https://www.khronos.org/registry/OpenGL/extensions/OES/OES_compressed_ETC1_RGB8_texture.txt) is supported on most mobile GPUs

[PVRTC](https://en.wikipedia.org/wiki/PVRTC) is supported on GPUs made by PowerVR/Imgtec which is all iPhones (and some Androids?)

If you want to use them you generally run some offline tools to generate them and then either write a loader for the format the tools spits out or roll your own. You then pull the data out of the file and call `gl.compressedTexImage2D(...)` with the data.

The advantages to compressed texture formats are that they take less GPU memory so you can use more of them and also that they can take less memory bandwidth meaning they can potentially run faster. The disavantage is that although they are compressed they aren't compressed nearly as small as say a .jpg (generally) so they may take longer to transmit over the internet. For games stored on your local machine like a game you install from Steam you really don't care about how faster the game downloads, you expect it to take 10 minutes to several hours. For a WebGL game meant to be played on a webpage most users will not wait very long so there's a trade off.

Another issue with these formats is like it says above they only work on certain devices. To support them across devices you'd need to do something like query WebGL by calling `gl.getExtension` for the various compression formats and then request from your server the correct set of textures for the user's device. For native games that's generally not an issue since an Android app is made separtely from an iPhone app and that's separate from a desktop app but for a web page ideally you'd like any device to be able to run the same page. A desktop machine, a tablet, maybe a smartphone. (although for android there are many GPUs so the problem is similar there for native android apps)

Here's [an article that explains PVRTC](https://www.imgtec.com/blog/pvrtc-the-most-efficient-texture-compression-standard-for-the-mobile-graphics-world/) and [another about DXT/S3TC](http://blog.wolfire.com/2009/01/dxtc-texture-compression/)
