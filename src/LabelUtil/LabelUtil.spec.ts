/*eslint-env jest*/

import LabelUtil from './LabelUtil';
import { select } from 'd3-selection';

describe('LabelUtil', () => {

  it('is defined', () => {
    expect(LabelUtil).not.toBeUndefined();
  });

  it('properly wraps legend texts', () => {
    document.body.innerHTML = '<body><svg width="100" height="100"><g><text class="legend-title" text-anchor="start"' +
      ' dy="0" dx="25">SOME 1 - Toolonglegendtext</text></g></svg></body>';
    LabelUtil.handleLabelWrap(select(document.body).select('svg'), undefined, 0, 1.2, false, 10);
    const tspans = select(document.body).selectAll('tspan');
    expect(tspans.nodes().length).toEqual(4);
  });

});
