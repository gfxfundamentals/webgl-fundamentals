Title: WEBGL_draw_buffers not supported on chrome 37
Description:
TOC: qna

# Question:

I have trouble getting the webgl extension `WEBGL_draw_buffers` on chrome. My GPU should definitely support multiple draw buffers, Firefox supports the extension, but Chrome does not list it. Is there any reason for the missing support?

general info
------------

* Browser: Chrome 37.0.2062.102 m (same result with version 36 and 38)
* Browser command line: `Files (x86)\Google\Chrome\Application\chrome.exe" --flag-switches-begin --js-flags=--harmony --enable-webgl-draft-extensions --flag-switches-end`
* Operating system: Windows 8.1 Pro
* GPU: NVS 3100M (driver version 327.02)
* Notebook: ThinkPad T410
* Other people seem to get `WEBGL_draw_buffers` support on Chrome
* I did not find any information about Chrome bugs related to disabled multiple draw buffers.

webgl extensions available
--------------------------

    GL_OES_element_index_uint GL_OES_packed_depth_stencil GL_OES_get_program_binary GL_OES_rgb8_rgba8 NV_pixel_buffer_object GL_OES_mapbuffer GL_EXT_map_buffer_range GL_OES_standard_derivatives GL_OES_texture_half_float GL_OES_texture_half_float_linear GL_OES_texture_float GL_OES_texture_float_linear GL_EXT_texture_rg GL_OES_texture_npot GL_EXT_occlusion_query_boolean GL_EXT_read_format_bgra GL_EXT_robustness GL_EXT_shader_texture_lod GL_EXT_texture_compression_dxt1 GL_EXT_texture_filter_anisotropic GL_EXT_texture_format_BGRA8888 GL_EXT_texture_storage GL_EXT_frag_depth GL_EXT_blend_minmax GL_ANGLE_depth_texture GL_ANGLE_framebuffer_blit GL_ANGLE_framebuffer_multisample GL_ANGLE_instanced_arrays GL_ANGLE_pack_reverse_row_order GL_ANGLE_texture_compression_dxt3 GL_ANGLE_texture_compression_dxt5 GL_ANGLE_texture_usage GL_ANGLE_translated_shader_source GL_NV_fence

chrome://gpu problems reported
------------------------------

    Problems Detected
    GPU rasterization is whitelisted on N4, N5, N7 and Moto X: 362779
    Disabled Features: gpu_rasterization
    Additional GPU rasterization whitelist for field trial: 380694
    Disabled Features: gpu_rasterization_field_trial
    Always call glUseProgram after a successful link to avoid a driver bug: 349137
    Applied Workarounds: use_current_program_after_successful_link
    Some drivers are unable to reset the D3D device in the GPU process sandbox
    Applied Workarounds: exit_on_context_lost
    TexSubImage2D() is faster for full uploads on ANGLE
    Applied Workarounds: texsubimage2d_faster_than_teximage2d
    Clear uniforms before first program use on all platforms: 124764, 349137
    Applied Workarounds: clear_uniforms_before_first_program_use
    Threaded rasterization has not been enabled or is not supported by the current system.
    Disabled Features: threaded_rasterization

# Answer

I don't know the exact reasons but as Jan points out they are not widely available

It's not just about if the GPU supports it. For a long time OSX would crash the OS if MRTs were set up incorrectly therefore it was not enabled on OSX. They are still not enabled on my Retina MBP running 10.9.4 (OSX Mavericks) 

Typing

    document.createElement("canvas").getContext("webgl").getSupportedExtensions().join("\n")

in the JavaScript console prints

    "ANGLE_instanced_arrays
    EXT_texture_filter_anisotropic
    WEBKIT_EXT_texture_filter_anisotropic
    OES_element_index_uint
    OES_standard_derivatives
    OES_texture_float
    OES_texture_float_linear
    OES_texture_half_float
    OES_texture_half_float_linear
    OES_vertex_array_object
    WEBGL_compressed_texture_s3tc
    WEBKIT_WEBGL_compressed_texture_s3tc
    WEBGL_debug_renderer_info
    WEBGL_debug_shaders
    WEBGL_depth_texture
    WEBKIT_WEBGL_depth_texture
    WEBGL_lose_context
    WEBKIT_WEBGL_lose_context"

So I'm guessing they still haven't found a way to stop the OS from crashing when MRTs are set up incorrectly. Bitch to Apple and the other driver makers. 

Games and Apps don't have this problem because they of course don't want to crash your machine and because you manually install them but browsers can't allow random webpages to crash your machine so they can't enable these features until they can find a way to either prevent the crashes or until the drivers/OS stop crashing when they are used.
