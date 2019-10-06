Title: Playing multiple video's and changing source during runtime without waiting for browser/video buffer
Description:
TOC: qna

# Question:

I'm playing around doing some simple image filter/analysis using webGL. At the moment what I'm doing is applying some filters(using framebuffers) on two different images and then combining the results into one image. I've done this with success so far but now I want to do it on videos in realtime. This is where I ran into some interesting issues.

If I define the videos in the HTML file I can play them both at the same time. But if I try to add the videos dynamically in javascript during runtime I can't get them to play simultaneously. Or rather, if I play one video it starts instantly, but if I try to start the other video it won't start until the first video is fully buffered as I understand it. So I only have two videos playing for a short time(and also I have to wait a looong time).

Is there some way to create new video elements and play them at the same time? Preferably I would be able to change source at will and have them buffer/play at the same time.

To clarify I'm using Chrome and HTML5 video elements. And also if I'm using to low res/small sized vides it works. But using higher res/big videos doesn't work.

# Answer

One solution would be to put all your videos in one video. For example if you had 4 videos then make a video where the top left 1/4 of the screen is video #1, the top right is video #2, the bottom left is video 3# and the bottom right is video #4.

Then either use a shader with a uniform to select which corner of the texture to display or else make a quad for each corner with pre baked UVs to select which part of the video to display.

This would certainly be the easiest way. I don't think there's any other solution that will play N videos at the same time without buffering and other issues.
