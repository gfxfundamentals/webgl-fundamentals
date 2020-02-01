import {addSVG} from './utils.js';

function getPageRelativeRect(elem) {
  let rect;
  for (;;) {
    rect = elem.getBoundingClientRect();
    if (rect.width > 0) {
      break;
    }
    elem = elem.parentElement;
  }
  const left = rect.left + window.scrollX | 0;
  const top = rect.top + window.scrollY | 0;
  const width = rect.width | 0;
  const height = rect.height | 0;
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

/*
function getElemRelativePosition(elem, x, y) {
  const rect = getPageRelativeRect(elem);
  return {
    x: (x >= 0 ? rect.right + x : rect.left + x) | 0,
    y: (y >= 0 ? rect.bottom + y : rect.top + y) | 0,
  };
}
*/


/*
const svg = addSVG('svg', document.body, {
  width: '100%',
  height: '100%',
  viewBox: '0 0 640 480',
  version: '1.1',
  xmlns: "http://www.w3.org/2000/svg",
  style: styleToText({
    'font-family': 'monospace',
  }),
});


function attrsPlusClass(attrs, className) {
  if (className) {
    attrs['class'] = className;
  }
  return attrs;
}


function addText(parent, str, x, y, className, style) {
  const attrs = attrsPlusClass({
    x,
    y,
    ...style && {style},
  }, className);
  const text = addSVG('text', parent, attrs);
  text.textContent = str;
  return text;
}

function addRect(parent, x, y, width, height, style, className) {
  const attrs = attrsPlusClass({
    x,
    y,
    width,
    height,
    ...style && {style},
  }, className);
  return addSVG('rect', parent, attrs);
}

function addGroup(parent, transform) {
  transform = transform || ms.current();
  return addSVG('g', parent, {transform})
}
*/

function addArrow(parent, color, arrowheadId, options) {
  const {markerSide, attrs: pathAttrs} = options;
  const marker = parent.querySelector(`#${arrowheadId}`);
  if (!marker) {
    const defs = parent.querySelector('defs');
    const marker = addSVG('marker', defs, {
      id: arrowheadId,
      viewBox: '0 0 10 10',
      refX: 6,
      refY: 5,
      markerWidth: 6,
      markerHeight: 6,
      orient: 'auto',
      fill: color,
    });
    addSVG('circle', marker, {
      cx: 5,
      cy: 5,
      r: 5,
    });
  }

  const attrs = Object.assign({
    fill: 'none',
    stroke: color,
    'stroke-width': '2',
  });
  if (markerSide) {
    attrs[markerSide] = `url(#${arrowheadId})`;
  }
  const group = addSVG('g', parent, attrs);

  return {
    group,
    path: addSVG('path', group, pathAttrs),
  };
}

const p = ({x, y}) => `${x},${y}`;

const arrowCPOff = 100;
const arrowStartOff = 1;
const arrowEndOff = 15;
const arrowEndRightOff = 25;

function updateArrow(arrow) {
  const {arrowSegment, startSegment, divA, divB, options} = arrow;
  const arrowPath = arrowSegment.path;
  const startSegmentPath = startSegment.path;

  const a = getPageRelativeRect(divA);
  const b = getPageRelativeRect(divB);
  const aContainer = divA.closest('.window-content');
  const c = getPageRelativeRect(aContainer);

  // startDir right
  // +--------+
  // |+---+   |
  // ||   A   C  cCP
  // |+---+   |
  // +--------+
  //
  // endDir left
  //                    +----+
  //                bCP B    |
  //                    |    |
  //                    +----+
  //
  // startDir left
  //                +--------+
  //                |+---+   |
  //           cCP  CA   |   |
  //                |+---+   |
  //                +--------+
  //
  // endDir right
  // +----+
  // |  B D dCP
  // |    |
  // +----+
  //
  const {startDir, endDir, offset} = options;
  let posA;
  let posC;
  let posCCP;
  switch (startDir) {
    case 'right':
      posA = {
        x: a.right,
        y: a.top + a.height / 2,
      };
      posC = {
        x: c.right + arrowStartOff,
        y: posA.y,
      };
      posCCP = {
        x: posC.x + arrowCPOff,
        y: posC.y,
      };
      break;
    case 'left':
      posA = {
        x: a.left,
        y: a.top + a.height / 2,
      };
      posC = {
        x: c.left - arrowStartOff,
        y: posA.y,
      };
      posCCP = {
        x: posC.x - arrowCPOff,
        y: posC.y,
      };
      break;
    default:
      throw new Error(`unknown startDir: ${startDir}`);
  }

  posA.x += offset.start.x;
  posA.y += offset.start.y;
  posC.y += offset.start.y;
  posCCP.y += offset.start.y;

  let posB;
  let posBCP;
  switch (endDir) {
    case 'right':
      posB = {
        x: b.right + arrowEndRightOff,
        y: b.top  + b.height / 2,
      };
      posBCP = {
        x: posB.x + arrowCPOff,
        y: posB.y,
      };
      break;
    case 'left':
      posB = {
        x: b.left - arrowEndOff,
        y: b.top  + b.height / 2,
      };
      posBCP = {
        x: posB.x - arrowCPOff,
        y: posB.y,
      };
      break;
    default:
      throw new Error(`unknown endDir: ${endDir}`);
  }

  posB.x += offset.end.x;
  posB.y += offset.end.y;
  posBCP.y += offset.end.y;

  const posARel = {
    x: posA.x - c.left,
    y: posA.y - c.top,
  };
  const posCRel = {
    x: posC.x - c.left,
    y: posC.y - c.top,
  };
  startSegmentPath.setAttribute("d", `M${p(posARel)} L${p(posCRel)}`);
  arrowPath.setAttribute("d", `M${p(posC)} C${p(posCCP)} ${p(posBCP)} ${p(posB)}`);
}

/*

        <marker id="arrowhead" viewBox="0 0 10 10" refX="3" refY="5"
            markerWidth="6" markerHeight="6" orient="auto" fill="red">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
*/

const zeroZero = {x: 0, y: 0};
const zeroOffset = {
  start: zeroZero,
  end: zeroZero,
};

const defaultOptions = {
  startDir: 'right',
  endDir: 'left',
  offset: zeroOffset,
};

function getInnerSVG(elem) {
  const win = elem.closest('.window-content');
  let innerSVG = win.querySelector('.draggable-svg');
  if (!innerSVG) {
    innerSVG = addSVG('svg', win, {'class': 'draggable-svg'});
    addSVG('defs', innerSVG);
  }
  return innerSVG;
}

export default class ArrowManager {
  constructor(svg) {
    this.svg = svg;
    this.arrows = [];
    this.arrowHeadIdsByColor = {};
  }
  _getArrowhead(color) {
    const arrowId = this.arrowHeadIdsByColor[color];
    if (arrowId) {
      return arrowId;
    }
    const defs = this.svg.querySelector('defs');
    const id = color.replace(/[^a-z0-9]/g, '-');
    const marker = addSVG('marker', defs, {
      id,
      viewBox: '0 0 10 10',
      refX: 3,
      refY: 5,
      markerWidth: 6,
      markerHeight: 6,
      orient: 'auto',
      fill: color,
    });
    addSVG('path', marker, {
      d: 'M 0 0 L 10 5 L 0 10 z',
    });
    this.arrowHeadIdsByColor[color] = id;
    return id;
  }
  add(divA, divB, color = 'red', options = defaultOptions) {
    const {attrs} = options;
    const arrowheadId = this._getArrowhead(color);
    const arrowSegment = addArrow(this.svg, color, arrowheadId, {attrs, markerSide: 'marker-end'});
    const startSegmentSVG = getInnerSVG(divA);
    const endSegmentSVG = getInnerSVG(divB);

    const startSegment = addArrow(startSegmentSVG, color, `${arrowheadId}-s`, {attrs, markerSide: 'marker-start'});
    const endSegment = addArrow(endSegmentSVG, color, `${arrowheadId}-e`, {attrs});

    const arrow = {
      arrowSegment,
      startSegment,
      endSegment,
      divA,
      divB,
      options: Object.assign({}, defaultOptions, options),
    };
    arrow.options.offset = Object.assign({}, defaultOptions.offset, arrow.options.offset);
    this.arrows.push(arrow);
    updateArrow(arrow);
    return arrow;
  }
  remove(arrow) {
    const ndx = this.arrows.indexOf(arrow);
    if (ndx >= 0) {
      this.arrows.splice(ndx, 1);
      arrow.arrowSegment.group.remove();
      arrow.startSegment.group.remove();
      arrow.endSegment.group.remove();
    }
  }
  update() {
    const remove = this.arrows.filter(arrow => !document.body.contains(arrow.divB));
    for (const r of remove) {
      this.remove(r);
    }
    this.arrows.forEach(updateArrow);
  }
}

// this is crap but easy
export const arrowManager = new ArrowManager(document.querySelector('#arrows'));
