Title: I get invalid type error when calling readPixels
Description: I get invalid type error when calling readPixels
TOC: I get invalid type error when calling readPixels

## Question:

    context.readPixels(0, 0, context.drawingBufferWidth, context.drawingBufferHeight, context.RGBA, context.FLOAT, pixels);

This is the code. I get this error in the console:
**WebGL: INVALID_ENUM: readPixels: invalid type**

But this works perfectly fine:

    context.readPixels(0, 0, context.drawingBufferWidth, context.drawingBufferHeight, context.RGBA, context.UNSIGNED_BYTE, pixels);

Float or int is supposed to be supported, but only unsigned_byte works.
There's no resource online on how to correctly apply a type that seems to work.
Everything follows a different pattern.

## Answer:

FLOAT is not guaranteed to be supported. The only format/type combination that is guaranteed to be supported is RGBA/UNSIGNED_BYTE. [See Spec, section 4.3.1](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf)

After that one other **implementation dependent** format/type combo might be supported depending on the type of thing you're reading. You can query that with

```
const altFormat = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
const altType = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
```

{{{example url="../webgl-qna-i-get-invalid-type-error-when-calling-readpixels-example-1.html"}}}

The code above makes a RGBA/FLOAT texture and attached it to a framebuffer then checks the alternate format/type combo to read it. On Chrome it gets RGBA/UNSIGNED_BYTE, on Firefox it gets RGBA/FLOAT. Both are valid responses since the alternate combo is **implementation dependent**.



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/6704900">Tony Arntsen</a>
    from
    <a data-href="https://stackoverflow.com/questions/61984296">here</a>
  </div>
</div>
