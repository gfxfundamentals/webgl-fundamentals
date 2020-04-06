"use strict";

function duplicate(src) {
  const d = new window.DOMMatrix();
  d.a = src.a;
  d.b = src.b;
  d.c = src.c;
  d.d = src.d;
  d.e = src.e;
  d.f = src.f;
  return d;
}

const darkColors = {
  arrow: '#DDD',
};
const lightColors = {
  arrow: '#000',
};
const darkMatcher = window.matchMedia("(prefers-color-scheme: dark)");
let colors;

function renderSceneGraph(root) {
  const canvas = document.querySelector("#c");
  const ctx = wrapCanvasRenderingContext2D(canvas.getContext("2d"));
  var g_update = true;

  function getRelativeMousePosition(event, target) {
    target = target || event.target;
    const rect = target.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  // assumes target or event.target is canvas and has no border/padding
  function getNoBorderNoPaddingRelativeMousePosition(target, event) {
    target = target || event.target;
    const pos = getRelativeMousePosition(event, target);

    pos.x = pos.x * target.width  / canvas.clientWidth;
    pos.y = pos.y * target.height / canvas.clientHeight;

    return pos;
  }

  const pointers = {
  };

  const setPointer = function(id, pos, pressed) {
    var pointer = pointers[id];
    if (!pointer) {
      pointer = { };
      pointers[id] = pointer;
    }
    pointer.pos = pos;
    if (pressed) {
      pointer.pressed = true;
    }
  };

  const clearPointer = function(id, pos) {
    var pointer = pointers[id];
    if (!pointer) {
      pointer = { };
      pointers[id] = pointer;
    }
    pointer.pos = pos;
    pointer.pressed = false;
  };
  canvas.addEventListener('pointerdown', function(e) {
    const pos = getNoBorderNoPaddingRelativeMousePosition(e.target, e);
    setPointer(e.pointerId, pos, true);
    g_update = true;
  }, true);

  canvas.addEventListener('pointermove', function(e) {
    const pos = getNoBorderNoPaddingRelativeMousePosition(e.target, e);
    setPointer(e.pointerId, pos);
    g_update = true;
  }, false);

  canvas.addEventListener('pointerup', function(e) {
    const pos = getNoBorderNoPaddingRelativeMousePosition(e.target, e);
    clearPointer(e.pointerId, pos);
    g_update = true;
  }, false);

  function inRect(ctx, width, height, x, y) {
    x = x || 0;
    y = y || 0;
    var inv = duplicate(ctx.currentTransform);
    inv.invertSelf();
//    ctx.save();
//      ctx.strokeStyle = "#0F0";
//      ctx.strokeRect(x, y, width, height);
//    ctx.restore();
    for (var id in pointers) {
      if (pointers.hasOwnProperty(id)) {
        const p = pointers[id];
        if (p.pressed) {
          const pnt = inv.transformPoint(new DOMPoint(p.pos.x, p.pos.y, 0, 1));
          if (pnt.x >= x && pnt.x < x + width &&
              pnt.y >= y && pnt.y < y + height) {
            return {
              x: (pnt.x - x) / width,
              y: (pnt.y - y) / height,
              pointer: p,
            };
          }
        }
      }
    }
  }

  const borderSize = 10;
  const height = 30;
  var somethingPressed;

  function drawArrow(node, parent) {
    ctx.save();
    ctx.rotate(node.rotation);
    ctx.translate(node.translation[0], node.translation[1]);
    const mat = duplicate(ctx.currentTransform);
    ctx.restore();
    const inv = duplicate(ctx.currentTransform);
    inv.invertSelf();
    inv.multiplySelf(mat);

    ctx.save();
    if (node.draw !== false && parent && parent.draw !== false) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(inv.e, inv.f);
      ctx.stroke();
    }
    ctx.rotate(node.rotation);
    ctx.translate(node.translation[0], node.translation[1]);
    node.children.forEach(function(child) {
      drawArrow(child, node);
    });
    ctx.restore();
  }

  function drawNode(node) {
    ctx.save();
    ctx.rotate(node.rotation);
    ctx.translate(node.translation[0], node.translation[1]);
    const tm = ctx.measureText(node.name);
    const rx = -tm.width / 2 - borderSize;
    const ry = -height / 2;
    const width = tm.width + borderSize * 2;
    if (node.draw !== false) {
      ctx.fillStyle = node.pressed ? "#F0F" : "#0FF";
      ctx.strokeStyle = "black";
      ctx.fillRect(rx, ry, width, height);
      ctx.strokeRect(rx, ry, width, height);
      ctx.fillStyle = "black";
      ctx.strokeStyle = "black";
      ctx.fillText(node.name, 0, 1);
    } else {
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(5, 5);
      ctx.moveTo(-5, 5);
      ctx.lineTo(5, -5);
      ctx.stroke();
    }
    node.children.forEach(drawNode);

    // Check UI stuff after children since children get
    // drawn last they appear in front.
    if (node.pressed) {
      if (node.pressed.pointer.pressed) {
        const diff = node.pressed.pointer.pos.x - node.startX;
        node.rotation = node.startRot - diff * 0.01;
      } else {
        somethingPressed = false;
        node.pressed = null;
      }
    } else if (!somethingPressed) {
      if (node.draw !== false) {
        node.pressed = inRect(ctx, width, height, rx, ry);
        if (node.pressed) {
          somethingPressed = node;
          node.startRot = node.rotation;
          node.startX   = node.pressed.pointer.pos.x;
        }
      }
    }


    ctx.restore();
  }

  function drawScene() {
    const isDarkMode = darkMatcher.matches;
    colors = isDarkMode ? darkColors : lightColors;
    webglUtils.resizeCanvasToDisplaySize(ctx.canvas);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, 40);
//    var scale = window.devicePixelRatio * ctx.canvas.height / 1000;
//    ctx.scale(scale, scale);
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = colors.arrow;
    drawArrow(root);
    drawNode(root);
    ctx.restore();
  }

  function render() {
    if (g_update) {
      g_update = false;
      drawScene();
    }

    requestAnimationFrame(render, canvas);
  }
  render();
}


