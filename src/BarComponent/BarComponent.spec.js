/*eslint-env jest*/

import BarComponent from './BarComponent.js';
import select from 'd3-selection/src/select';

describe('BarComponent', () => {

  it('is defined', () => {
    expect(BarComponent).not.toBeUndefined();
  });

  it('can render bars', () => {
    const component = new BarComponent({
      data: {
        data: [{
          value: '123',
          values: [{
            index: 'one',
            value: 0.1,
            color: '#ff0000'
          }]
        }],
        grouped: ['one', 'two']
      },
      position: [0, 0],
      size: [100, 100],
      axes: {
        groupx: {
          scale: 'band',
          orientation: 'x',
          min: 0,
          max: 10
        },
        groupedx: {
          scale: 'band',
          orientation: 'x',
          min: 0,
          max: 10
        },
        y: {
          scale: 'log',
          orientation: 'y',
          display: true
        }
      }
    });
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node, [100, 100]);
    expect(node.select('.barchart').node()).not.toEqual(null);
  });

});
