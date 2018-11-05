/*eslint-env jest*/

import LegendComponent from './LegendComponent.js';
import select from 'd3-selection/src/select';

describe('LegendComponent', () => {

  it('is defined', () => {
    expect(LegendComponent).not.toBeUndefined();
  });

  it('can render legends', () => {
    const component = new LegendComponent({
      items: [{
        type: 'bar',
        style: {
          stroke: '#ff0000'
        }
      }],
      position: [0, 0]
    });
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node, [100, 100]);
    expect(node.select('.legend').node()).not.toEqual(null);
  });

});
