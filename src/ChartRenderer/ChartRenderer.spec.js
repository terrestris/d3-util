/*eslint-env jest*/

import ChartRenderer from './ChartRenderer.js';
import select from 'd3-selection/src/select';

describe('ChartRenderer', () => {

  it('is defined', () => {
    expect(ChartRenderer).not.toBeUndefined();
  });

  it('can be instantiated', () => {
    const renderer = new ChartRenderer();
    expect(renderer).toBeTruthy();
  });

  it('can render an empty config', () => {
    document.body.innerHTML = '<div/>';
    const renderer = new ChartRenderer({
      components: [],
      size: [100, 100],
      zoomType: 'none'
    });
    expect(() => {
      renderer.render(document.body);
    }).not.toThrow();
  });

  it('can reset the zoom on an empty config', () => {
    const renderer = new ChartRenderer({
      components: []
    });
    expect(renderer.resetZoom.bind(renderer)).not.toThrow();
  });

  it('will render components', () => {
    const components = [{
      enableZoom: true
    }];
    components[0].render = jest.fn(() => undefined);
    components[0].enableZoom = jest.fn(() => undefined);
    components[0].resetZoom = jest.fn(() => undefined);
    const renderer = new ChartRenderer({
      components,
      size: [100, 100]
    });
    renderer.render();
    expect(components[0].render.mock.calls.length).toBe(1);
    expect(components[0].enableZoom.mock.calls.length).toBe(1);
    renderer.resetZoom();
    expect(components[0].resetZoom.mock.calls.length).toBe(1);
  });

  it('can render an empty config with dynamic size set', () => {
    document.body.innerHTML = '<div/>';
    const renderer = new ChartRenderer({
      components: [{
        render: node => node.append('text').attr('transform', 'translate(100, 100)')
      }, {
        render: node => node.append('text')
      }, {
        render: node => node.append('text').attr('transform', 'rotate(34)')
      }],
      size: [100, 100],
      zoomType: 'none',
      dynamicSize: true
    });
    expect(() => {
      renderer.render(document.body);
    }).not.toThrow();
    const svg = select(document.body).select('svg');
    expect(svg.attr('width')).toBe('100');
    expect(svg.attr('height')).toBe('120');
    expect(renderer.resetZoom.bind(renderer)).not.toThrow();
  });

});
