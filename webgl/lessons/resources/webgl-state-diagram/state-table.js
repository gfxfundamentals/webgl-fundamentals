
import {
  addElem,
  getColorForWebGLObject,
  helpToMarkdown,
} from './utils.js';
import {
  formatWebGLObject,
  formatWebGLObjectOrCanvas,
  formatWebGLObjectOrDefaultVAO,
  formatWebGLObjectOrDefaultTFO,
  getWebGLObjectInfo,
  getWebGLObjectInfoOrCanvas,
  getWebGLObjectInfoOrDefaultVAO,
  getWebGLObjectInfoOrDefaultTFO,
} from './context-wrapper.js';
import {
  createExpander,
  flashSelfAndExpanderIfClosed,
} from './ui.js';
import {arrowManager} from './arrows.js';

const elemToArrowMap = new Map();

export function createStateGrid(statesInfo, parent, queryFn, update = true) {
  const {states} = statesInfo;
  const table = addElem('table', parent);
  const tbody = addElem('tbody', table);
  for (const state of states) {
    const {pname, help} = state;
    const tr = addElem('tr', tbody);
    tr.dataset.help = helpToMarkdown(help);
    addElem('td', tr, {textContent: pname});
    addElem('td', tr);
  }
  if (update) {
    updateStateTable(statesInfo, table, queryFn, true);
  }
  return table;
}

export function createStateTable(statesInfo, parent, title, queryFn, update = true) {
  const {help} = statesInfo;
  const expander = createExpander(parent, title, {}, help);
  const div = addElem('div', expander, {className: 'expander-content'});
  createStateGrid(statesInfo, div, queryFn, update);
  return expander;
}

export function updateStateTable(statesInfo, parent, queryFn, initial) {
  const {states} = statesInfo;
  const tbody = parent.querySelector('tbody');
  // NOTE: Assumption that states array is parallel to table rows
  states.forEach((state, rowNdx) => {
    const {formatter} = state;
    const raw = queryFn(state);
    const value = formatter(raw);
    const row = tbody.rows[rowNdx];
    const cell = row.cells[1];
    const isNew = cell.textContent !== value.toString();
    cell.textContent = value;
    if (isNew) {
      // FIX: should put this data else were instead of guessing
      if (formatter === formatWebGLObject ||
          formatter === formatWebGLObjectOrDefaultVAO ||
          formatter === formatWebGLObjectOrDefaultTFO ||
          formatter === formatWebGLObjectOrCanvas) {
        const oldArrow = elemToArrowMap.get(cell);
        if (oldArrow) {
          arrowManager.remove(oldArrow);
          elemToArrowMap.delete(cell);
        }
        // FIX: should put this data else were instead of guessing
        const targetInfo = raw
            ? getWebGLObjectInfo(raw)
            : (formatter === formatWebGLObjectOrDefaultVAO)
                ? getWebGLObjectInfoOrDefaultVAO(raw)
                : (formatter === formatWebGLObjectOrDefaultTFO)
                   ? getWebGLObjectInfoOrDefaultTFO(raw)
                   : (formatter === formatWebGLObjectOrCanvas)
                     ? getWebGLObjectInfoOrCanvas(raw)
                     : null;
        if (targetInfo && !targetInfo.deleted) {
          elemToArrowMap.set(
              cell,
              arrowManager.add(
                  cell,
                  targetInfo.ui.elem.querySelector('.name'),
                  getColorForWebGLObject(raw, targetInfo.ui.elem)));
        }
      }
    }

    if (!initial && isNew) {
      flashSelfAndExpanderIfClosed(row);
    }
  });
}

