import { select } from 'd3-selection';
import { NodeSelection } from '../BaseUtil/BaseUtil';

export type ZoomType = 'transform' | 'rerender' | 'none';

export interface ChartComponent {
  render: (root: NodeSelection, size?: [number, number]) => void;
  enableZoom?: (root: NodeSelection, zoomType: ZoomType) => void;
  resetZoom?: () => void;
}

export interface ChartConfiguration {
  size?: [number, number];
  components: ChartComponent[];
  zoomType?: ZoomType;
  dynamicSize?: boolean;
  onMouseMoveFunc?: () => {};
}

/**
 * Renders a chart according to its configuration.
 */
export class ChartRenderer {

  chartConfig: ChartConfiguration = null;

  /**
   * Constructs a renderer object.
   * @param {object} chartConfig the chart configuration to use
   */
  constructor(chartConfig?: ChartConfiguration) {
    this.chartConfig = chartConfig;
  }

  /**
   * Create a root svg node at the given element.
   * @param  {element} element the surrounding element
   * @return {SVGElement} the new root svg node
   */
  createSvgRoot(element: HTMLElement) {
    const {
      size
    } = this.chartConfig;

    return select(element)
      .append('svg')
      .attr('top', 0)
      .attr('left', 0)
      .attr('width', size[0])
      .attr('height', size[1])
      .attr('viewBox', '0 0 ' + size[0] + ' ' + size[1]);
  }

  /**
   * Render the chart to the given dom element.
   * @param  {element} element the dom element
   */
  render(element?: HTMLElement) {
    const {
      components,
      size,
      zoomType,
      dynamicSize,
      onMouseMoveFunc
    } = this.chartConfig;

    select(element).selectAll('svg').remove();

    const svg = this.createSvgRoot(element);

    components.forEach(component => {
      component.render(svg, size);
      if (component.enableZoom) {
        component.enableZoom(svg, zoomType);
      }
    });

    if (onMouseMoveFunc) {
      svg
      .on('mousemove', function() {
        onMouseMoveFunc();
      });
    }

    if (dynamicSize) {
      // this currently only works properly for legend heights
      let width = 0;
      let height = 0;
      svg.selectAll('svg > *').each(function(this: HTMLElement) {
        const box = (this as HTMLElement).getBoundingClientRect();
        width += box.width;
        height += box.height;
        if (this.getAttribute('transform')) {
          const match = this.getAttribute('transform').match(/translate[(](\d+)[ ,]+(\d+)/);
          if (match) {
            width += parseInt(match[1], 10);
            height += parseInt(match[2], 10);
          }
          // the height calculation seems to be an imprecise business, so round
          // the value up to the next 10 based multiple
          // This is probably due to text rendering/rects or something and
          // should be improved to take text rendering heights properly into
          // account
          height = height - (height % 10) + 10;
        }
      });
      svg.attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);
    }
  }

  /**
   * Reset zoom if enabled on a component.
   */
  resetZoom() {
    this.chartConfig.components.forEach(component => {
      if (component.resetZoom) {
        component.resetZoom();
      }
    });
  }

}

export default ChartRenderer;
