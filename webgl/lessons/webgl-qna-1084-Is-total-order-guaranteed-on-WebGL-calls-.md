Title: Is total order guaranteed on WebGL calls?
Description:
TOC: qna

# Question:

By reading [this answer](https://stackoverflow.com/a/51717185) I now know that WebGL always runs on a separate process and its calls are, in fact, asynchronous with regards to the main JavaScript code. However, can I expect, since the commands are enqueued by the JavaScript code, to have them executed in the same order they are called in my code? Even if another command is still executing when I proceed with my JavaScript, if I happened to run another call to `WebGL` it should get enqueued and execute when the previous one is over, or at least this is what I understood.

What should I pay attention to, in order to avoid having `WebGL` commands run in an unexpected way, if this is even possible?

# Answer

> Is total order guaranteed on WebGL calls?

Yes. From [the spec](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf)

> Commands are always processed in the order in which they are received, although there may be an indeterminate delay before the effects of a command are
realized. This means, for example, that one primitive must be drawn completely
before any subsequent one can affect the framebuffer. It also means that queries
and pixel read operations return state consistent with complete execution of all previously invoked GL commands. In general, the effects of a GL command on either
GL modes or the framebuffer must be complete before any subsequent command
can have any such effects.
