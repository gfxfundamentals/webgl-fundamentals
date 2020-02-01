
/* global gl */

import {
  addElem,
  addRemoveClass,
  createElem,
  createTemplate,
  helpToMarkdown,
  px,
  setName,
} from './utils.js';

import {
  getWebGLObjectInfo,
} from './context-wrapper.js';

import {
  createExpander,
  expand,
  makeDraggable,
} from './ui.js';

import {
  createStateTable,
  updateStateTable,
} from './state-table.js';

import {
  globals,
} from './globals.js';

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

export function createTextureDisplay(parent, name, texture) {
  const texElem = createTemplate(parent, '#texture-template');
  setName(texElem, name);
  const nameLine = texElem.querySelector('.name-line');
  const badElem = createElem('div', {
    textContent: '☢',
    className: 'bad',
    dataset: {
      help: globals.isWebGL2
          ? helpToMarkdown(`
            <span style="color:red;">**This texture is un-renderable!**</span>

            NOTE: If a sampler is applied to the texture unit it may maybe this
            texture renderable.

            One or more of the following are true

            * It as never been bound. A texture's type is unknown until bound at least once
            * It has only 1 mip level that is larger than 1x1 but filtering is set to
              use mips.
            * It has a mip chain that doesn't match. Each lower mip is not half the width
              and half the height of the previous mip or they are different internal formats.
            * It doesn't have mips set to all specified mip levels.
            * It's a --CUBE_MAP-- but it's not square or its sides are not the same size
            `)
          : helpToMarkdown(`
            <span style="color:red;">**This texture is un-renderable!**</span>

            One or more of the following are true

            * It as never been bound. A texture's type is unknown until bound at least once
            * It has only 1 mip level that is larger than 1x1 but filtering is set to
              use mips.
            * It's dimensions are not power-of-2 and has filtering on that requires mips
              or has wrapping set to something other than --CLAMP_TO_EDGE--
            * It has a mip chain that doesn't match. Each lower mip is not half the width
              and half the height of the previous mip or they are different internal formats.
            * It needs mips but doesn't have mips all the way down to 1x1 size.
            * It's a --CUBE_MAP-- but it's not square or its sides are not the matching sizes
            `),
    },
  });
  nameLine.insertBefore(badElem, nameLine.lastChild);

  const mipsExpander = createExpander(texElem, 'mips');
  const mipsOuterElem = addElem('div', mipsExpander);
  const mipsElem = addElem('div', mipsOuterElem, {className: 'mips'});
  const maxMips = 8;
  const mips = [];

  function isGood() {
    const info = getWebGLObjectInfo(texture);
    const target = info.target;
    if (!target) {
      return false;  // never bound
    }

    const firstMip = mips[0];
    if (!firstMip) {
      return false;  // no mips
    }

    let {width, height} = firstMip;
    const isPOT = globals.isWebGL2 || (isPowerOf2(width) && isPowerOf2(height));

    const minFilter = gl.getTexParameter(target, gl.TEXTURE_MIN_FILTER);
    const needsMips = minFilter !== gl.NEAREST && minFilter !== gl.LINEAR;
    if (!isPOT && needsMips) {
      return false;
    }

    if (!isPOT) {
      const wrapS = gl.getTexParameter(target, gl.TEXTURE_WRAP_S);
      const wrapT = gl.getTexParameter(target, gl.TEXTURE_WRAP_T);
      if (wrapS !== gl.CLAMP_TO_EDGE || wrapT !== gl.CLAMP_TO_EDGE) {
        return false;
      }
    }

    if (needsMips) {
      let level = 0;
      for (;;) {
        if (width === 1 && height === 1) {
          break;
        }
        width = Math.max(width >> 1, 1);
        height = Math.max(height >> 1, 1);
        const mip = mips[++level];
        if (!mip || mip.width !== width || mip.height !== height) {
          return false;
        }
      }
    }

    return true;
  }

  function updateGood() {
    addRemoveClass(badElem, 'good', isGood());
  }

  function updateMips() {
    let size = 128;
    let foundMip = false;

    mipsElem.innerHTML = '';

    const info = getWebGLObjectInfo(texture);
    const target = info.target;
    const magFilter = gl.getTexParameter(target, gl.TEXTURE_MAG_FILTER);
    const minFilter = gl.getTexParameter(target, gl.TEXTURE_MIN_FILTER);

    for (let i = 0; i < maxMips; ++i) {
      const filter = i === 0
         ? magFilter === gl.LINEAR
         : minFilter === gl.NEAREST_MIPMAP_LINEAR || minFilter === gl.LINEAR_MIPMAP_LINEAR;
      if (foundMip) {
        size = Math.max(size / 2, 1);
      }
      const mipCanvas = mips[i];
      if (!mipCanvas) {
        continue;
      }
      foundMip = true;
      const width = size;
      const height = Math.max(size * mipCanvas.height / mipCanvas.width, 1);

      mipCanvas.remove();
      mipCanvas.style.width = px(width);
      mipCanvas.style.height = px(height);
      mipCanvas.classList.remove('filtering-linear');
      mipCanvas.classList.remove('filtering-nearest');
      mipCanvas.classList.add(filter ? 'filtering-linear' : 'filtering-nearest');

      const div = addElem('div', mipsElem, {
        className: `mip${i}`,
        dataset: {
          help: helpToMarkdown(`
            Uploading data

            ---js
            const target = gl.TEXTURE_2D;
            const level = ${i};
            const internalFormat = gl.RGBA;
            const width = ${size};
            const height = ${size};
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;
            gl.texImage2D(
                target, level, internalFormat,
                width, height, 0, format, type,
                someUnit8ArrayWith${size}x${size}x4Values);
            ---

            Uploading an image/canvas/video. The image must
            have finished downloading.

            ---js
            const target = gl.TEXTURE_2D;
            const level = ${i};
            const internalFormat = gl.RGBA;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;
            gl.texImage2D(
                target, level, internalFormat,
                format, type, imageCanvasVideoElem);
            ---

            mips > 0 can be generated by calling
            --gl.generateMipmap(gl.TEXTURE_2D);--

            ${globals.stateTables.activeTexNote}`),
        },
      });
      div.appendChild(mipCanvas);
    }
    updateGood();
  }

  function updateMipFromData(target, level, internalFormat, width, height, border, format, type, data) {
    // only handle LUMINANCE for now
    // don't handle UNPACK_ALIGNMENT
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (data) {
      const imgData = ctx.createImageData(width, height);
      const pixels = imgData.data;

      for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          const srcOff = y * width + x;
          const dstOff = srcOff * 4;
          pixels[dstOff    ] = data[srcOff];
          pixels[dstOff + 1] = data[srcOff];
          pixels[dstOff + 2] = data[srcOff];
          pixels[dstOff + 3] = 0xFF;
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }

    mips[level] = canvas;
    updateMips();
  }

  function makeCanvasCopyOfElement(elem, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(elem, 0, 0, width, height);
    return ctx.canvas;
  }

  function updateMipFromImage(target, level, internalFormat, format, type, element) {
    const {width, height} = element;
    mips[level] = makeCanvasCopyOfElement(element, width, height);
    updateMips();
  }

  function updateMip(..._args) {
    const args = [..._args];
    switch (args.length) {
      case 9:
        updateMipFromData(...args);
        break;
      case 6:
        updateMipFromImage(...args);
        break;
      default:
        throw new Error('unknown arguments for texImage2D');
    }
  }

  function generateMips() {
    let level = 0;
    for (;;) {
      const mipCanvas = mips[level++];
      const {width, height} = mipCanvas;
      if (width === 1 && height === 1) {
        break;
      }
      const mipWidth = Math.max(width / 2 | 0, 1);
      const mipHeight = Math.max(height / 2 | 0, 1);
      mips[level] = makeCanvasCopyOfElement(mipCanvas, mipWidth, mipHeight);
    }
    updateMips();
  }


  const updateContentsAfterBeingRenderedTo = (texture, level/*, face*/) => {
    // assuming 2D, renderable, ...
    globals.executeWebGLWrappers = false;
    const {width, height, data} = globals.renderTexture(texture);
    globals.executeWebGLWrappers = true;
    // copy the data to a new canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    imgData.data.set(data);
    ctx.putImageData(imgData, 0, 0);
    // draw to the mip canvas scaling to fit
    const dstCanvas = mips[level];
    const dstCtx = dstCanvas.getContext('2d');
    dstCtx.save();
    dstCtx.globalCompositeOperation = 'copy';
    dstCtx.translate(0, dstCanvas.height);
    dstCtx.scale(1, -1);
    dstCtx.drawImage(canvas, 0, 0, dstCanvas.width, dstCanvas.height);
    dstCtx.restore();
  };

  const updateData = () => {};

  const queryFn = state => {
    const {pname} = state;
    const info = getWebGLObjectInfo(texture);
    const target = info.target;
    const value = gl.getTexParameter(target, gl[pname]);
    updateGood();
    return value;
  };

  const stateTable = createStateTable(globals.stateTables.textureState, texElem, 'texture state', queryFn, false);

  expand(mipsExpander);
  expand(stateTable);
  makeDraggable(texElem);

  return {
    elem: texElem,
    updateData,
    updateContentsAfterBeingRenderedTo,
    updateState: (initial = false) => {
      const info = getWebGLObjectInfo(texture);
      const target = info.target;
      // because when texture is created we don't know what kind it is until
      // first bind (2D, CUBE_MAP, ...)
      if (target) {
        updateStateTable(globals.stateTables.textureState, stateTable, queryFn, initial);
        updateMips();
      }
    },
    updateMip,
    generateMips,
  };
}

export function createSamplerDisplay(parent, name, sampler) {
  const samplerElem = createTemplate(parent, '#sampler-template');
  setName(samplerElem, name);

  const updateData = () => {};

  const queryFn = state => {
    const {pname} = state;
    const value = gl.getSamplerParameter(sampler, gl[pname]);
    return value;
  };

  const stateTable = createStateTable(globals.stateTables.textureState, samplerElem, 'sampler state', queryFn);
  expand(stateTable);
  makeDraggable(samplerElem);

  return {
    elem: samplerElem,
    updateData,
    updateState: () => {
      updateStateTable(globals.stateTables.textureState, stateTable, queryFn);
    },
  };
}



