/**
 * A component that can be used in the chart renderer to render a legend.
 */
class LegendComponent {

  SVG_DEFS = {
    LEGEND_ICON_BACKGROUND: 'M-3 -14 h 25 v 16 h -25 Z',
    LEGEND_ICON_AREA: 'M0 -6 C 3 0, 7 0, 10 -6 S 15 -12, 20 -6 M20 -6 v 6 h -20 v -6 Z',
    LEGEND_ICON_BAR: 'M0 -10 h 6 v 12 h -6 Z M7 -6 h 6 v 8 h -6 Z M14 -10 h 6 v 12 h -6 Z',
    LEGEND_ICON_LINE: 'M0 -6 C 3 0, 7 0, 10 -6 S 15 -12, 20 -6'
  }

  /**
   * Constructs a new legend component.
   * @param {Object} config the legend configuration
   */
  constructor(config) {
    this.config = config;
    // just ignore legend items w/o type
    config.items = config.items.filter(item => item.type);
  }

  /**
   * Apply the style properties.
   * @param  {Object} style the style properties
   * @param  {d3.selection} node the node to apply the properties to
   */
  applyStyle(style, node) {
    Object.entries(style).forEach(([prop, value]) => {
      node.style(prop, value);
    });
  }

  constructLegendElement = (item, idx, g) => {
    const leg = g.append('g')
      .attr('transform', `translate(0, ${idx * 20})`);
    const path = leg.append('path')
      .attr('d', () => {
        const typeUppercase = item.type.toUpperCase();
        return this.SVG_DEFS['LEGEND_ICON_' + typeUppercase];
      })
      .style('stroke', 'none')
      .style('fill', 'none');
    this.applyStyle(item.style, path);

    g.append('path')
      .attr('d', this.SVG_DEFS.LEGEND_ICON_BACKGROUND)
      .style('stroke', 'none')
      // invisible, but still triggering events
      .style('fill', 'rgba(0,0,0,0)');
    g.append('text')
      .text(item.title)
      .attr('text-anchor', 'start')
      .attr('dy', '0')
      .attr('dx', '25');

    g.append('title')
      .text(item.title);

    if (item.customRenderer instanceof Function) {
      item.customRenderer(g);
    }
  }

  /**
   * Render the legend.
   * @param  {d3.selection} root the root node
   * @param  {number[]} size the size of the svg
   */
  render(root) {
    const g = root.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.config.position}, 20)`);

    this.config.items.forEach((item, idx) => this.constructLegendElement(item, idx, g));
  }

}

export default LegendComponent;
