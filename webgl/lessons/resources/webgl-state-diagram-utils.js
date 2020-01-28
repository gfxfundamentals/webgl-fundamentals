/* eslint strict: "off" */
/* eslint no-undef: "error" */

/* global */

const px = (v) => `${v}px`;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const formatG = v => typeof v === 'number' ? v.toFixed(3).replace(/\.?0+$/, '') : v;
function formatX(v, n = 0) {
  const s = v.toString(16);
  return `0x${s.padStart(n, '0').substr(0, 2)}`;
}
const formatX2 = v => formatX(v, 2);
const formatBoolean = v => v.toString();


let flashElements = [];

function removeFlashes() {
  flashElements.forEach(elem => elem.classList.remove('flash'));
  flashElements = [];
}

function flash(elem) {
  elem.classList.remove('flash');
  setTimeout(() => {
    elem.classList.add('flash');
    flashElements.push(elem);
  }, 1);
  flashElements.push(elem);
}

function updateElem(elem, newValue, flashOnChange = true) {
  const needUpdate = elem.textContent !== newValue;
  if (needUpdate) {
    elem.textContent = newValue;
    if (flashOnChange) {
      flash(elem);
    }
  }
  return needUpdate;
}

function helpToMarkdown(s) {
  s = s.replace(/---/g, '```')
       .replace(/--/g, '`');
  const m = /^\n( +)/.exec(s);
  if (!m) {
    return s;
  }
  const lines = s.split('\n');
  if (lines[0].trim() === '') {
    lines.shift();
  }
  if (lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
  const indent = m[1];
  return lines.map(line => line.startsWith(indent) ? line.substr(indent.length) : line).join('\n');
}

function addElem(tag, parent, attrs = {}) {
  const elem = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        try {
        elem[key][k] = v;
        } catch (e) {
          debugger;  // eslint-disable-line no-debugger
        }
      }
    } else if (elem[key] === undefined) {
      elem.setAttribute(key, value);
    } else {
      elem[key] = value;
    }
  }
  parent.appendChild(elem);
  return elem;
}

function addSVG(tag, parent, attrs = {}) {
  const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    elem.setAttribute(key, value);
  }
  parent.appendChild(elem);
  return elem;
}

function createTable(parent, headings) {
  const table = addElem('table', parent);
  const thead = addElem('thead', table);
  headings.forEach(heading => addElem('th', thead, {textContent: heading}));
  return addElem('tbody', table);
}

function formatUniformValue(v) {
  if (v.buffer && v.buffer instanceof ArrayBuffer) {
    v = Array.from(v);
  }
  if (Array.isArray(v)) {
    if (v.length > 4) {
      // should really look at type of uniform
      const mod = v.length % 3 === 0 ? 3 : 4;
      const rows = [];
      for (let i = 0; i < v.length; i += mod) {
        const row = [];
        const end = Math.min(i + mod, v.length);
        for (let j = i; j < end; ++j) {
          row.push(formatG(v[j]));
        }
        rows.push(row.join(', '));
      }
      return rows.join(',\n');
    }
    return v.map(formatG).join(', ');
  }
  return typeof v === 'number' ? formatG(v) : v;
}

function createTemplate(parent, selector) {
  const template = document.querySelector(selector);
  const collection = template.content.cloneNode(true);
  if (collection.children.length !== 1) {
    throw new Error('template must have 1 child');
  }
  const elem = collection.children[0];

  // HACK to fix help
  const nameElem = elem.querySelector('.name');
  if (nameElem) {
    const nameParent = nameElem.parentElement;
    const nameLine = addElem('div', nameParent, {className: 'name-line'});
    nameLine.remove();
    nameParent.insertBefore(nameLine, nameElem);
    nameElem.remove();
    nameLine.appendChild(nameElem);
    addElem('div', nameLine, {
      className: 'name-help',
      dataset: {
        help: elem.dataset.help,
      },
      textContent: '?',
    });
    delete elem.dataset.help;
  }

  parent.appendChild(elem);
  return elem;
}

export {
  px,
  wait,
  formatG,
  formatX,
  formatX2,
  formatBoolean,
  formatUniformValue,
  createTemplate,
  updateElem,
  helpToMarkdown,
  flash,
  removeFlashes,
  addElem,
  addSVG,
  createTable,
};