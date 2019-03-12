/*eslint-env jest*/

import BaseUtil, { BackgroundConfiguration, TitleConfiguration, NodeSelection } from './BaseUtil';
import { select } from 'd3-selection';

describe('BaseUtil', () => {

  it('is defined', () => {
    expect(BaseUtil).not.toBeUndefined();
  });

  it('can render a background', () => {
    document.body.innerHTML = '<svg></svg>';
    const root = select(document.body).select('svg');
    BaseUtil.addBackground(root as NodeSelection, 0, {
      size: [100, 100]
    } as BackgroundConfiguration, [100, 100]);
    expect(select(document.body).select('rect').node()).toBeTruthy();
  });

  it('can render a background given a color', () => {
    document.body.innerHTML = '<svg></svg>';
    const root = select(document.body).select('svg');
    BaseUtil.addBackground(root as NodeSelection, 0, {
      size: [100, 100],
      backgroundColor: '#ff0000'
    }, [100, 100]);
    expect((root.select('rect').node() as HTMLElement).style.opacity).not.toEqual(0);
  });

  it('can add a title', () => {
    document.body.innerHTML = '<svg></svg>';
    const root = select(document.body).select('svg');
    BaseUtil.addTitle(root as NodeSelection, {
      title: 'Some title',
      size: [100, 100],
      position: [100, 100]
    } as TitleConfiguration, 100);
    expect(root.select('text').node()).toBeTruthy();
  });

  it('skips adding a title if not configured', () => {
    document.body.innerHTML = '<svg></svg>';
    const root = select(document.body).select('svg');
    BaseUtil.addTitle(root as NodeSelection, {}, 100);
    expect(root.select('text').node()).toBeFalsy();
  });

});
