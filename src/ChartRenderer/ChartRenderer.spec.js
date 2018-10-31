/*eslint-env jest*/

import ChartRenderer from './ChartRenderer.js';

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

});
