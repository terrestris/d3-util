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

  config = {
    items: [{
      title: 'Label',
      type: 'line',
      color: '#ff0000',
      width: 1
    }, {
      title: 'Label 2',
      type: 'area',
      color: '#ff0000',
    }, {
      title: 'Label 3',
      type: 'bar',
      color: '#ff0000',
      width: 1
    }]
  }

  /**
   * Constructs a new legend component.
   * @param {Object} config the legend configuration
   */
  constructor(config) {
    this.config = config;
  }

  constructLegendElement = (item, idx, g) => {
    const leg = g.append('g')
      .attr('transform', `translate(0, ${idx * 20})`);
    leg.append('path')
      .attr('d', () => {
        const typeUppercase = item.type.toUpperCase();
        return this.SVG_DEFS['LEGEND_ICON_' + typeUppercase];
      })
      .style('stroke', () => {
        switch (item.type) {
          case 'line':
            return item.color;
          default:
            return 'none';
        }
      })
      .style('stroke-width', () => {
        switch (item.type) {
          case 'line':
            return item.width;
          default:
            return 0;
        }
      })
      .style('fill', () => {
        switch (item.type) {
          case 'line':
            return 'none';
          default:
            return item.color;
        }
      });
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
