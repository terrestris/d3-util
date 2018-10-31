/*eslint-env jest*/

import BaseUtil from './BaseUtil.js';
import select from 'd3-selection/src/select';

describe('BaseUtil', () => {

  it('is defined', () => {
    expect(BaseUtil).not.toBeUndefined();
  });

  it('can render a background', () => {
    document.body.innerHTML = '<svg></svg>';
    const root = select(document.body).select('svg');
    BaseUtil.addBackground(root, 0, {
      size: [100, 100]
    });
    expect(select(document.body).select('rect').node()).toBeTruthy();
  });

  it('can render a background given a color', () => {
    document.body.innerHTML = '<svg></svg>';
    const root = select(document.body).select('svg');
    BaseUtil.addBackground(root, 0, {
      size: [100, 100],
      backgroundColor: '#ff0000'
    });
    expect(root.select('rect').node().style.opacity).not.toEqual(0);
  });

  it('can add a title', () => {
    document.body.innerHTML = '<svg></svg>';
    const root = select(document.body).select('svg');
    BaseUtil.addTitle(root, {
      title: 'Some title'
    }, [100, 100]);
    expect(root.select('text').node()).toBeTruthy();
  });

  it('skips adding a title if not configured', () => {
    document.body.innerHTML = '<svg></svg>';
    const root = select(document.body).select('svg');
    BaseUtil.addTitle(root, {}, [100, 100]);
    expect(root.select('text').node()).toBeFalsy();
  });

});
