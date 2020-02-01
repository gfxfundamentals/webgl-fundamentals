
import {
  addElem,
  getColorForWebGLObject,
  helpToMarkdown,
} from './utils.js';
import {
  formatWebGLObject,
  formatWebGLObjectOrDefaultVAO,
  getWebGLObjectInfo,
  getWebGLObjectInfoOrDefaultVAO,
} from './context-wrapper.js';
import {
  createExpander,
  flashSelfAndExpanderIfClosed,
} from './ui.js';
import {arrowManager} from './arrows.js';

const elemToArrowMap = new Map();

export function createStateTable(statesInfo, parent, title, queryFn, update = true) {
  const {states, help} = statesInfo;
  const expander = createExpander(parent, title, {}, help);
  const div = addElem('div', expander, {className: 'expander-content'});
  const table = addElem('table', div);
  const tbody = addElem('tbody', table);
  for (const state of states) {
    const {pname, help} = state;
    const tr = addElem('tr', tbody);
    tr.dataset.help = helpToMarkdown(help);
    addElem('td', tr, {textContent: pname});
    addElem('td', tr);
  }
  if (update) {
    updateStateTable(statesInfo, expander, queryFn, true);
  }
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
    // FIX: should put this data else were instead of guessing
    if (isNew) {
      if (formatter === formatWebGLObject || formatter === formatWebGLObjectOrDefaultVAO) {
        const oldArrow = elemToArrowMap.get(cell);
        if (oldArrow) {
          arrowManager.remove(oldArrow);
          elemToArrowMap.delete(cell);
        }
        const targetInfo = raw
            ? getWebGLObjectInfo(raw)
            : (formatter === formatWebGLObjectOrDefaultVAO)
                ? getWebGLObjectInfoOrDefaultVAO(raw)
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

