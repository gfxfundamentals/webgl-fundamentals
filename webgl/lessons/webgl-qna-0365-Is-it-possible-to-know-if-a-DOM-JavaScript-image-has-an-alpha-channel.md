Title: Is it possible to know if a DOM/JavaScript image has an alpha channel
Description:
TOC: qna

# Question:

I'm using images as textures in webgl, and it requires knowing the format of the image, mainly RGB or RGBA. So given an Image() gotten via XMLHttpRequest, can I find out how many channels it has?

I realize I can fiddle with it by converting it to a 2D Canvas then reformat it for webgl, but I'd like to avoid that.

# Answer

No, there is no way to know except to draw to a canvas and check every pixel or to write your own image loader and read the headers and the pixels

The problem is arguably unsolvable except to check all the pixels except for a few cases.

1.  JPGs are RGB so if JPG then no alpha. 

    Of course you can only know if it's JPG by guessing based on the URL. Because even if the URL is ".jpg" if the server sends the header "Content-Type: image/png" then the browser will interpret the file as a PNG. If you're supplying all the files though then you'd know.

2.  If it's PNG you could use code to read the header

    That would suck because you'd end up downloading the file twice. Once for the browser to turn it into an image. Another XHR request to download the data as binary so you can read the header.  Maybe if you're lucky the browser would only download it once and provide the second copy from the cache.

    But, even if you did that, just because the header says there is an alpha channel doesn't mean 100% of that alpha channel is not 255 (1.0).

3.  Even if images have alpha channels they aren't always used as alpha channels. 

    it's common to put height maps or gloss maps or reflectivity maps or glow maps in the alpha channel. That's very application specific.

If I were you I wouldn't try to look at the alpha channel. I'd either assume all images have alpha. Or I'd have my artists explicitly mark the images how they want them used either by filename or other metadata.


