/*eslint-env jest*/

import TimeseriesComponent from './TimeseriesComponent.js';
import select from 'd3-selection/src/select';

describe('TimeseriesComponent', () => {

  let component;

  beforeEach(() => {
    component = new TimeseriesComponent({
      series: [{
        data: [[1, 1], [2, 3]],
        axes: ['x', 'y'],
        curveType: 'linear'
      }],
      axes: {
        x: {
          scale: 'linear',
          orientation: 'x',
          min: 0,
          max: 10
        },
        y: {
          scale: 'log',
          orientation: 'y'
        }
      },
      position: [0, 0],
      size: [100, 100]
    });
  });

  it('is defined', () => {
    expect(TimeseriesComponent).not.toBeUndefined();
  });

  it('can render line charts', () => {
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node, [100, 100]);
    const series = node.select('.timeseries-line').node();
    expect(series).not.toEqual(null);
    expect(node.select('g.timeseries-chart').node()).not.toEqual(null);
  });

  it('can enable the zoom', () => {
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node, [100, 100]);
    component.enableZoom(node);
    expect(component.zoomBehaviour).not.toBeUndefined;
  });

});
