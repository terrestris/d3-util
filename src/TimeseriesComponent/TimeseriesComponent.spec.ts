/*eslint-env jest*/

import TimeseriesComponent, { TimeseriesConfiguration } from './TimeseriesComponent';
import { select } from 'd3-selection';
import { NodeSelection } from '../BaseUtil/BaseUtil';

describe('TimeseriesComponent', () => {

  let component: TimeseriesComponent;

  beforeEach(() => {
    component = new TimeseriesComponent({
      series: [{
        data: [[1, 1, undefined, {
          type: 'star',
          radius: 5,
          fill: 'red',
          stroke: 'red',
          sides: 12
        }], [2, 3, undefined, {
          type: 'star'
        }], [1, 1, undefined, {
          type: 'circle'
        }], [1, 1], [1, 1, undefined, {
          type: 'rect',
          fill: 'red'
        }]],
        axes: ['x', 'y'],
        curveType: 'linear'
      }],
      axes: {
        x: {
          scale: 'linear',
          orientation: 'x',
          min: 0,
          max: 10,
          display: true
        },
        y: {
          scale: 'log',
          orientation: 'y',
          display: true,
          showGrid: true
        }
      },
      position: [0, 0],
      size: [100, 100]
    } as unknown as TimeseriesConfiguration);
  });

  it('is defined', () => {
    expect(TimeseriesComponent).not.toBeUndefined();
  });

  it('can render line charts', () => {
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node as NodeSelection, [100, 100]);
    const series = node.select('.timeseries-line').node();
    expect(series).not.toEqual(null);
    expect(node.select('g.timeseries-chart').node()).not.toEqual(null);
  });

  it('can enable the zoom', () => {
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node as NodeSelection, [100, 100]);
    component.enableZoom(node as NodeSelection, 'rerender');
    expect(component.zoomBehaviour).not.toBeUndefined();
  });

});
