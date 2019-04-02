import { Selection } from 'd3-selection';
import LabelUtil from '../LabelUtil/LabelUtil';

export type NodeSelection = Selection<Element, {}, undefined, undefined>;
export type SVGSelection = Selection<SVGElement, {}, undefined, undefined>;

export interface BackgroundConfiguration {
  backgroundColor?: string;
  size?: [number, number];
}

export interface TitleConfiguration {
  title?: string;
  size?: [number, number];
  position?: [number, number];
  titlePadding?: string|number;
  titleSize?: number;
  titleColor?: string;
  maxTitleLength?: number;
}

/**
 * Class with helper functions to create/manage chart axes.
 */
class BaseUtil {

  /**
   * Adds background color.
   * @param {d3.selection} root to render the background rect to
   * @param {Number} offset the x offset to use
   * @param {Object} config the chart config object
   * @param {Number[]} size the resulting chart size w/o axes
   */
  static addBackground(root: NodeSelection, offset: number, config: BackgroundConfiguration, size: [number, number]) {
    const color = config.backgroundColor ? config.backgroundColor : 'black';
    root.select('.timeseries-background').remove();
    root.insert('rect', ':first-child')
      .attr('class', 'timeseries-background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', size[0] - offset)
      .attr('height', size[1])
      .style('opacity', config.backgroundColor ? 1 : 0)
      .style('fill', color);
  }

  /**
   * Adds a title.
   * @param {d3.selection} root the node to render the title on
   * @param {Object} config the chart config object
   * @param {Number} xOffset the x offset to add
   */
  static addTitle(root: NodeSelection, config: TitleConfiguration, xOffset: number) {
    if (config.title) {
      const x = (config.size[0] + xOffset + config.position[0]) / 2;
      const text = root.append('text')
        .attr('x', x)
        .attr('y', parseInt(config.titlePadding as string, 10) +
          parseInt(config.titleSize as unknown as string || '20', 10))
        .attr('dy', 0)
        .attr('class', 'timeseries-title')
        .style('text-anchor', 'middle')
        .style('font-size', config.titleSize || 20)
        .style('fill', config.titleColor)
        .text(config.title);
      if (config.maxTitleLength) {
        LabelUtil.wordWrap(text, config.maxTitleLength, x, 1.2, x);
        text.selectAll('tspan')
          .style('text-anchor', 'middle')
          .style('font-size', config.titleSize || 20)
          .style('fill', config.titleColor);
      }
    }
  }

}

export default BaseUtil;
