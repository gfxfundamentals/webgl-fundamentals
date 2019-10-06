Title: Can I reshape a texture while preserving its contents?
Description:
TOC: qna

# Question:

Is there a way to adjust the width and height of a texture while not zeroing or overwriting its contents? I'd like to do this without a drawing cycle since for some operations a certain arrangement of W-H would be more suitable than others.


# Answer

Is there a direct way? No.

You'd have to copy the contents to another texture, then resize the original, then copy it back. 

But, if you're going to go to that trouble you might as well just make some texture class that when you resize makes a new texture, copies the old contents to the new texture and deletes the old texture.
