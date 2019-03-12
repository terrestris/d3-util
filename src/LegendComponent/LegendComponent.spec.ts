/*eslint-env jest*/

import LegendComponent from './LegendComponent';
import { select } from 'd3-selection';
import { NodeSelection } from '../BaseUtil/BaseUtil';

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
    component.render(node as NodeSelection);
    expect(node.select('.legend').node()).not.toEqual(null);
  });

  it('can render custom legend content', () => {
    const component = new LegendComponent({
      items: [{
        type: 'bar',
        style: {
          stroke: '#ff0000'
        },
        customRenderer: node2 => node2.append('text').attr('class', 'some-class')
      }],
      position: [0, 0]
    });
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node as NodeSelection);
    expect(node.select('.some-class').node()).not.toEqual(null);
  });

  it('can handle the onClick option', () => {
    const component = new LegendComponent({
      items: [{
        type: 'bar',
        style: {
          stroke: '#ff0000'
        },
        onClick: () => undefined
      }],
      position: [0, 0]
    });
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node as NodeSelection);
    expect(node.select('g[style]').style('cursor')).toEqual('pointer');
  });

  it('can set contextmenu handler', () => {
    const component = new LegendComponent({
      items: [{
        type: 'bar',
        style: {
          stroke: '#ff0000'
        },
        contextmenuHandler: jest.fn(() => undefined)
      }],
      position: [0, 0]
    });
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node as NodeSelection);
  });

  it('can set extra classes', () => {
    const component = new LegendComponent({
      items: [{
        type: 'bar',
        style: {
          stroke: '#ff0000'
        }
      }],
      extraClasses: 'some-custom-class',
      position: [0, 0]
    });
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node as NodeSelection);
    expect(node.select('.some-custom-class').node()).not.toBe(null);
  });

  it('calls label wrap', () => {
    const component = new LegendComponent({
      items: [{
        type: 'bar',
        style: {
          stroke: '#ff0000'
        },
        title: 'some very long text'
      }],
      legendEntryMaxLength: 10,
      position: [0, 0]
    });
    document.body.innerHTML = '<body><svg width="100" height="100"></svg></body>';
    const node = select(document.body).select('svg');
    component.render(node as NodeSelection);
    expect(node.selectAll('tspan').size()).toBe(4);
  });

});
