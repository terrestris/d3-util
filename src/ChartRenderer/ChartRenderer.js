import select from 'd3-selection/src/select';

/**
 * Renders a chart according to its configuration.
 */
class ChartRenderer {

  chartConfig = {
    components: [],
    size: [500, 500]
  };

  /**
   * Constructs a renderer object.
   * @param {object} chartConfig the chart configuration to use
   */
  constructor(chartConfig) {
    this.chartConfig = chartConfig;
  }

  /**
   * Create a root svg node at the given element.
   * @param  {element} element the surrounding element
   * @return {SVGElement} the new root svg node
   */
  createSvgRoot(element) {
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
  render(element) {
    const {
      components,
      size
    } = this.chartConfig;

    select(element).selectAll('svg').remove();

    const svg = this.createSvgRoot(element);

    components.forEach(component => component.render(svg, size));
  }

}

export default ChartRenderer;
