Title: What happens in terms of memory allocation when gl.texImage2D is called?
Description:
TOC: qna

# Question:

I'm specifically interested in knowing how much texture memory is actually allocated if I used `gl.R32F` vs `gl.RGB32F`? Would GPU go ahead and allocate 4 channels per pixel anyway? Especially that the `gl_FragColor` is a `vec4` always.


# Answer

How much memory a texture takes is undefined. It's up to the driver. The driver might store R32F as RGBA32F, it might store RGB8 as RGBA8. It might have various limits requiring it to pad rows. For example say a 16byte or 128byte alignment requirement so that a 1x10 pixel R8 expands to 128x10 bytes. Other drivers might need to divide the image into squares with each square having minimal or fixed size, for example every square required to be 16x16 pixels so a 12x10 texture actually take 16x16 space and a 25x10 texture taking 32x16 space.

There is really no way to know exactly how much space a texture will use. I know of drivers that do all of these things.

From [the spec](https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf)

> internalformat is a symbolic constant indicating with what format and **minimum precision** the values should be stored by the GL

Notice the phrase "minimum precision". 

Elsewhere in the spec

>  the memory allocation per texture component is assigned by the GL to match **or exceed** the allocations listed in tables 3.13 - 3.14.

Tables 3.13 and 3.14 list the minimum size per channel in bits.

It's up to the driver to choose the actual way it stores things.

As an example I'd expect that most Desktop GPUs store `RGB5_A1` as `RGBA8` where as a mobile GPU might actually support `RGB5_A1` in the hardware itself and so would keep it as `RGB5_A1`. I suspect the same is true for all formats that are less than 8 bits per channel.
