(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else {
    // Browser globals
    var lib = factory.call(root);
    root.diagram = lib;
  }
}(this, function () {

  // make sure we're not using globals
  var ctx = undefined;
  var canvas = undefined;

  function drawEye(ctx, x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -height / 2, width, Math.PI * 0.2, Math.PI * 0.8, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0,  height / 2, width, Math.PI * 1.2, Math.PI * 1.8, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, width / 5, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.restore();
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    if (radius === undefined) {
      radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function arrow(ctx, x1, y1, x2, y2, start, end, size) {
    var size = size || 1;
    var rot = -Math.atan2(x1 - x2, y1 - y2);
    ctx.beginPath()
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (start) {
      arrowHead(ctx, x1, y1, rot, size);
    }
    if (end) {
      arrowHead(ctx, x2, y2, rot + Math.PI, size);
    }
  }

  function arrowHead(ctx, x, y, rot, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(size, size);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-5, -2);
    ctx.lineTo(0,  10);
    ctx.lineTo(5, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSun(ctx, x, y, radius) {
    // draw light
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, 0, radius / 3, 0, Math.PI * 2, false);
    ctx.fill();

    for (var ii = 0; ii < 12; ++ii) {
      ctx.rotate(1 / 12 * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(0, radius);
      ctx.lineTo( 5, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function rgba(r, g, b, a) {
    return "rgba(" +
      (r * 255 | 0) + "," +
      (g * 255 | 0) + "," +
      (b * 255 | 0) + "," +
      a + ")";
  }

  function rgb(r, g, b) {
    return rgba(r, g, b, 1);
  }

  function hsla(h, s, l, a) {
    return "hsla(" +
      ((h % 1) * 360 | 0) + "," +
      (s * 100) + "%," +
      (l * 100) + "%," +
      a + ")";
  }

  function hsl(h, s, l) {
    return hsla(h, s, l, 1);
  }

  function outlineText(ctx, msg, x, y) {
    ctx.strokeText(msg, x, y);
    ctx.fillText(msg, x, y);

  }

  return {
    rgb: rgb,
    rgba: rgba,
    hsl: hsl,
    hsla: hsla,
    arrow: arrow,
    arrowHead: arrowHead,
    drawEye: drawEye,
    drawSun: drawSun,
    outlineText: outlineText,
    roundedRect: roundedRect,
  };

}));

