/*eslint-env jest*/

import BarComponent, { BarConfiguration } from './BarComponent';
import { select } from 'd3-selection';
import { NodeSelection } from '../BaseUtil/BaseUtil';

describe('BarComponent', () => {

  const config = {
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
    },
    rotateBarLabel: false
  };

  it('is defined', () => {
    expect(BarComponent).not.toBeUndefined();
  });

  it('can render bars', () => {
    const component = new BarComponent(config as unknown as BarConfiguration);
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node as NodeSelection);
    expect(node.select('.barchart').node()).not.toEqual(null);
  });

  it('can render bars with rotated labels', () => {
    config.rotateBarLabel = true;
    const component = new BarComponent(config as unknown as BarConfiguration);
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node as NodeSelection);
    expect(node.select('.barchart').node()).not.toEqual(null);
    expect(() => component.setUncertaintyVisible(true)).not.toThrow();
    expect(() => component.toggleGrouped('one')).not.toThrow();
    expect(() => component.toggleGrouped('one')).not.toThrow();
    expect(() => component.toggleGroup('123')).not.toThrow();
    expect(() => component.toggleGroup('123')).not.toThrow();
  });

});
