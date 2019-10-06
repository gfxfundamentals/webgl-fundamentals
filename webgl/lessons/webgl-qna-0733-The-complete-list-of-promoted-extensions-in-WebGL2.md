Title: The complete list of promoted extensions in WebGL2
Description:
TOC: qna

# Question:

I got a chance to update our renderer we use to WebGL2. To make the renderer as backward compatible as possible we keep tracking of loaded extensions( as we did before the upgrade ) and emulate extensions even if such extension was promoted. The renderer does a few relevant things with extensions. From outside, everything is quite transparent.

To make it work smoothly, I need the complete list of promoted extensions. Have found few blogs, but those lists are not complete. Other lists which I have found on GitHub look wrong because they have redundant extensions which were in fact not promoted or were dropped. I have not found much in the docs.  

So, I did some empirical research and found :

    // 12 extensions were promoted in WebGL2 without surprises
    [
      'ANGLE_instanced_arrays',
      'EXT_blend_minmax',
      'EXT_frag_depth',
      'EXT_shader_texture_lod',
      'EXT_sRGB',
      'OES_element_index_uint',
      'OES_standard_derivatives',
      'OES_texture_float',
      'OES_texture_half_float',
      'OES_vertex_array_object',
      'WEBGL_depth_texture',
      'WEBGL_draw_buffers',
    ]

Particularly I'm concerned about `OES_texture_float_linear` and `OES_texture_half_float_linear` extensions which are not in my list. Implementation of WebGL2 I have locally has `OES_texture_float_linear` but does not have `OES_texture_half_float_linear`, while WebGL had both of them. I'm aware that in the WebGL1 context `OES_texture_float_linear` acts a bit differently, so my intuition says there could be problems. 

Also, something weird happened with the `disjoint_timer_query` extension. That extension was merged in partially. WebGL2 contexts got some properties of that extension. I have `disjoint_timer_query_webgl2` in Chrome which has all the properties except one `getQueryObject` which was renamed to `getQueryParameter`, but in Firefox the `disjoint_timer_query` extension is still available with a WebGL2 context.

So, is that list complete? And, particularly, should `OES_texture_half_float_linear` be on the list? And why is it gone, while the analogous `OES_texture_float_linear` stayed? 

Appreciate your help. 

-

So final answer ( probably ) should be :

    // 14 extensions were promoted in WebGL2
    [
      'ANGLE_instanced_arrays',
      'EXT_blend_minmax',
      'EXT_frag_depth',
      'EXT_shader_texture_lod',
      'OES_element_index_uint',
      'OES_standard_derivatives',
      'OES_texture_float',
      'OES_texture_half_float',
      'OES_vertex_array_object',
      'WEBGL_depth_texture',
      'WEBGL_draw_buffers',
      /* with caveats */
      'EXT_sRGB',
      'OES_texture_half_float_linear',
      'EXT_disjoint_timer_query',
    ]

Please note that last three extensions were promoted with caveats. 
Extension `EXT_sRGB` lost a constant `SRGB_ALPHA`.
Extension `OES_texture_half_float_linear` was promoted while analogous `OES_texture_float_linear` was not.
Extension `EXT_disjoint_timer_query` promoted partially. Some properties of that extension appeared in WebGL2 context, while other properties were moved to `EXT_disjoint_timer_query_webgl2` extension. Also, currently ( 2017.05.16 ) Firefox WebGL2 context still has `EXT_disjoint_timer_query` extensions and no `EXT_disjoint_timer_query_webgl2` extension.


# Answer

WebGL2 requires support for half and floating point textures. It also requires filtering for half textures but it does not require support for filtered floating point textures.

That's why `OES_texture_half_float_linear` missing and `OES_texture_float_linear` is optional. Most mobile devices do not support filtering for floating point textures.

In other words you should add `OES_texture_half_float_linear` to your list of promoted extensions.

Another extension that has a strange history is [`EXT_color_buffer_float`](EXT_color_buffer_float). WebGL1 shipped without it. It was assumed to render to a floating point texture all you needed was first `OES_texture_float` and then make a floating point texture, attach it to a framebuffer and check `gl.checkFramebufferStatus`. But, a year or so after WebGL shipped someone pointed out that was not enough and so `EXT_color_buffer_float` was added but it was not enforced because doing so would have broke pages.

In WebGL2 it *is* enforced. You can not render to a floating point texture without enabling `EXT_color_buffer_float`. Same for `EXT_color_buffer_half_float`.
