import BaseUtil from '../BaseUtil/BaseUtil';
import ScaleUtil from '../ScaleUtil/ScaleUtil';
import AxesUtil from '../AxesUtil/AxesUtil';
import d3color from 'd3-color/src/color';

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
   * Determine axes offsets.
   * @param {d3.scale} x the x scale
   * @param {d3.scale} y the y scale
   * @param {d3.selection} root the node to append to
   * @param {number[]} size the chart size
   * @return {number[]} the width of the y axis and the height of the x axis
   */
  determineAxesOffsets(x, y, root, size) {
    const xNode = AxesUtil.drawXAxis(x, root, size, this.config.axes.groupx).node();
    const yNode = AxesUtil.drawYAxis(y, this.config.axes.y, root, this.config.position[1]).node();
    const result = [yNode.getBoundingClientRect().width, xNode.getBoundingClientRect().height];
    xNode.remove();
    yNode.remove();
    return result;
  }

  /**
   * Render the timeseries to the given root node.
   * @param  {d3.selection} root the root node
   */
  render(root) {
    if (!this.config || !this.config.data || this.config.data.data.length === 0) {
      // refuse to render chart without data
      return;
    }

    let [x, groupedx, y] = ScaleUtil.createBarScales(this.config);
    x.paddingInner(0.1);
    const offsets = this.determineAxesOffsets(x, y, root, this.config.size);
    y = y.range([0, this.config.size[1] - offsets[1]]);
    x = x.range([0, this.config.size[0] - offsets[0]]);
    groupedx = groupedx.rangeRound([0, x.bandwidth()]);

    const g = root.append('g')
      .attr('class', `barchart ${this.config.extraClasses ? this.config.extraClasses : ''}`)
      .attr('transform', `translate(${offsets[0]}, 0)`);

    this.chartSize = [this.config.size[0] - offsets[0], this.config.size[1] - offsets[1]];
    const groups = g.selectAll('.bar-group').data(this.config.data.data);

    const shapes = groups.enter().append('g')
      .attr('transform', d => `translate(${x(d.value)},0)`)
      .attr('class', '.bar-group')
      .attr('value', d => d.value);

    const bars = this.renderBars(shapes, groupedx, y);
    this.renderUncertainty(bars, groupedx, y);
    this.renderLabels(bars, groupedx, y);

    AxesUtil.drawXAxis(x, root, this.config.size, this.config.axes.groupx)
      .attr('transform', `translate(${offsets[0]}, ${this.config.size[1] - offsets[1]})`);
    AxesUtil.drawYAxis(y, this.config.axes.y, root, 0);

    BaseUtil.addBackground(g, this.config.position[0], this.config, this.chartSize);
    BaseUtil.addTitle(root, this.config, this.config.position[0] + offsets[0]);
    this.rootNode = g;

    const padding = this.config.axes.groupx.labelPadding;

    root.attr('viewBox', `0 0 ${this.chartSize[0] + offsets[0] + (padding ? padding : 0)} ${this.chartSize[1] + offsets[1]}`)
      .attr('width', this.chartSize[0] + offsets[0] + (padding ? padding : 0))
      .attr('height', this.chartSize[1] + offsets[1] + this.config.yOffset);
  }

  /**
   * Render bar labels.
   * @param  {d3.selection} bars the selection to render the labels at
   * @param  {d3.scale} x the x scale
   * @param  {d3.scale} y the y scale
   */
  renderLabels(bars, x, y) {
    bars.append('text')
      .text(d => d.label)
      .attr('transform', d => {
        const chartSize = this.chartSize;
        const translateX = x(d.index) + (x.bandwidth() / 2);
        const translateY = d.belowThreshold ? chartSize[1] - 5 : (y(d.value) - 5 || chartSize[1]);
        return `translate(${translateX}, ${translateY})${this.config.rotateBarLabel ? ' rotate(-90)' : ''}`;
      })
      .attr('text-anchor', 'middle')
      .style('font-family', 'sans-serif')
      .style('font-size', '11px')
      .style('fill', '#000')
      .style('font-weight', 'bold')
      .style('unselectable', 'on');

    if (this.config.rotateBarLabel) {
      bars.selectAll('text')
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
  }

  /**
   * Render the bars.
   * @param  {d3.selection} shapes the node to append to
   * @param  {d3.scale} x the x scale
   * @param  {d3.scale} y the y scale
   * @return {d3.selection} the bars
   */
  renderBars(shapes, x, y) {
    const bars = shapes.selectAll('rect')
      .data(d => d.values)
      .enter()
      .append('g')
      .attr('value', d => d.index);

    bars
      .append('rect')
      .filter(d => !d.belowThreshold)
      .style('fill', d => d.color)
      .attr('x', d => x(d.index))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => this.chartSize[1] - y(d.value))
      .on('mouseover', (d, idx, bars) => {
        if (d.tooltipFunc) {
          d.tooltipFunc(bars[idx]);
        }
      });
    return bars;
  }

  /**
   * Render the uncertainty measure.
   * @param  {d3.selection} node the node to render the line to
   * @param  {d3.scale} x the x scale
   * @param  {d3.scale} y the y scale
   */
  renderUncertainty(node, x, y) {
    node
      .append('path')
      .attr('class', 'bar-uncertainty')
      .attr('d', d => {
        if (d.uncertainty && d.uncertainty > 0) {
          const lineWidth = x.bandwidth() / 3;
          const xCenter = x(d.index) + x.bandwidth() / 2;
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
      .attr('stroke', d => d3color(d.color).darker())
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 2);
  }

  /**
   * Toggle the group with the given index.
   * @param  {any} index the x value of the group
   */
  toggleGroup(index) {
    const node = this.rootNode.select(`[value="${index}"]`);
    if (node.attr('visible') === 'false') {
      node.style('display', 'block');
      node.attr('visible', 'true');
    } else {
      node.style('display', 'none');
      node.attr('visible', 'false');
    }
  }

  /**
   * Toggle the grouped bars with the given index
   * @param  {any} index the x value of the bars
   */
  toggleGrouped(index) {
    const node = this.rootNode.selectAll(`[value="${index}"]`);
    if (node.attr('visible') === 'false') {
      node.style('display', 'block');
      node.attr('visible', 'true');
    } else {
      node.style('display', 'none');
      node.attr('visible', 'false');
    }
  }

  /**
   * Set visibility of the uncertainty bar.
   * @param {Boolean} visible whether the uncertainty should be visible
   */
  setUncertaintyVisible(visible) {
    const node = this.rootNode.selectAll('.bar-uncertainty');
    node.style('display', visible ? 'block' : 'none');
  }

}

export default BarComponent;
