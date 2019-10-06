Title: Is WebGL hardware accelerated on mobile platforms?
Description:
TOC: qna

# Question:

I'm surprised how much trouble I'm having finding an answer to this question.  I want to know if WebGL is hardware accelerated on iOS and android.

# Answer

Yes, on the phones it's available on it is hardware accelerated. For iOS that's iOS8 and newer. For Android it depends on the device. If WebGL is supported on that device it's hardware accelerated.

That said, most mobile GPUs have far less power than desktop GPUs so while lots of WebGL content will run, some of it will run much slower. It depends on the particular WebGL program and the GPU.

