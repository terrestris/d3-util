import BaseUtil from '../BaseUtil/BaseUtil';
import ScaleUtil from '../ScaleUtil/ScaleUtil';
import AxesUtil from '../AxesUtil/AxesUtil';
import tinycolor from 'tinycolor2';

/**
 * A component that can be used in the chart renderer to render a bar chart.
 */
class BarComponent {

  /**
   * Constructs a new bar chart component.
   * @param {Object} config the bar chart configuration
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Render the timeseries to the given root node.
   * @param  {d3.selection} root the root node
   * @param  {number[]} size the size of the svg
   */
  render(root, size) {
    if (!this.config.data || this.config.data.data.length === 0) {
      // refuse to render chart without data
      return;
    }

    const g = root.append('g')
      .attr('class', 'barchart')
      .attr('width', this.config.size[0])
      .attr('height', this.config.size[1])
      .attr('transform', `translate(${this.config.position[0]}, ${this.config.position[1]})`);

    const [x, groupedx, y] = ScaleUtil.createBarScales(this.config);
    x.paddingInner(0.1);

    const groups = g.selectAll('.bar-group').data(this.config.data.data);

    const shapes = groups.enter().append('g')
      .attr('transform', d => `translate(${x(d.value)},0)`)
      .attr('class', '.bar-group')
      .attr('value', d => d.value);

    var bars = shapes.selectAll('rect')
      .data(d => d.values)
      .enter()
      .append('g');

    bars
      .append('rect')
      .filter(d => d)
      .style('fill', d => d.color)
      .attr('x', d => groupedx(d.index))
      .attr('y', d => y(d.value))
      .attr('width', groupedx.bandwidth())
      .attr('height', d => this.config.size[1] - y(d.value));

    // Uncertainty
    bars
      .append('path')
      .attr('class', 'bar-uncertainty')
      .attr('d', d => {
        if (d.uncertainty && d.uncertainty > 0) {
          const lineWidth = groupedx.bandwidth() / 3;
          const xCenter = groupedx(d.index) + groupedx.bandwidth() / 2;
          const topVal = d.value + (d.value / 100 * d.uncertainty);
          let bottomVal = d.value - (d.value / 100 * d.uncertainty);

          if (bottomVal < 0) {
            bottomVal = 0;
          }

          const yTop = y(topVal);
          const yBottom = y(bottomVal);

          return `M${xCenter - lineWidth},${yBottom}L${xCenter + lineWidth},${yBottom}` +
            `M${xCenter},${yBottom}L${xCenter},${yTop}` +
            `M${(xCenter - lineWidth)},${yTop}L${xCenter + lineWidth},${yTop}`;
        }
      })
      .attr('stroke', function(d) {
        const color = tinycolor(d.color);
        color.darken(40);
        return `#${color.toHex()}`;
      })
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 2);

    bars.append('text')
      .text(d => d.label)
      .attr('transform', d => {
        const chartSize = this.config.size;
        const translateX = groupedx(d.index) + (groupedx.bandwidth() / 2);
        const translateY = y(d.value) - 5 || chartSize[1];
        return `translate(${translateX}, ${translateY})`;
      })
      .attr('text-anchor', 'middle')
      .style('font-family', 'sans-serif')
      .style('font-size', '11px')
      .style('fill', '#000')
      .style('font-weight', 'bold')
      .style('unselectable', 'on');

    if (this.config.rotateBarLabel) {
      bars.selectAll('text')
        .attr('transform', d => {
          const chartSize = this.config.size;
          const translateX = groupedx(d.index) + (groupedx.bandwidth() / 2);
          const translateY = y(d.value) - 5 || chartSize[1];
          return `translate(${translateX}, ${translateY}) rotate(-90)`;
        })
        .attr('dy', (d, idx, el) => el[0].clientHeight / 4)
        .attr('dx', (d, idx, el) => {
          if (this.config.showLabelInsideBar) {
            const textElWidth = el[0].clientWidth;
            return (textElWidth + 5) * -1;
          } else {
            return 0;
          }
        })
        .style('text-anchor', 'start');
    }

    AxesUtil.drawXAxis(x, root, size, this.config.axes.groupx)
      .attr('transform', `translate(${this.config.position[0]}, ${size[1] - this.config.position[1]})`);

    AxesUtil.drawYAxis(y, this.config.axes.y, root)
      .attr('transform', `translate(0, ${this.config.position[1]})`);

    BaseUtil.addBackground(g, this.config.position[0], this.config);
    BaseUtil.addTitle(root, this.config, size);
  }

}

export default BarComponent;
