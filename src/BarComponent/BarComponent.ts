import BaseUtil, { NodeSelection, BackgroundConfiguration, TitleConfiguration } from '../BaseUtil/BaseUtil';
import ScaleUtil, { Scale } from '../ScaleUtil/ScaleUtil';
import AxesUtil, { AxisConfiguration } from '../AxesUtil/AxesUtil';
import { color as d3color } from 'd3-color';
import { ScaleBand } from 'd3-scale';

export interface BarChartDataValue {
  tooltipFunc?: Function;
  index: number;
  belowThreshold: boolean;
  uncertainty?: number;
  color: string;
  value: number;
}

export interface BarChartDataItem {
  value: number|string;
  label: string;
  values: BarChartDataValue[];
}

export interface BarChartData {
  data: BarChartDataItem[];
  grouped: string[];
}

export interface BarConfiguration extends BackgroundConfiguration, TitleConfiguration {
  axes: {
    x: AxisConfiguration;
    y: AxisConfiguration;
    groupx: AxisConfiguration;
  };
  size: [number, number];
  position?: [number, number];
  data: BarChartData;
  extraClasses?: string;
  yOffset?: number;
  rotateBarLabel?: boolean;
  showLabelInsideBar?: boolean;
  groupedInitiallyHidden: string[];
  groupsInitiallyHidden: string[];
}

/**
 * A component that can be used in the chart renderer to render a bar chart.
 */
class BarComponent {

  config: BarConfiguration;
  chartSize: [number, number];
  rootNode: NodeSelection;

  /**
   * Constructs a new bar chart component.
   * @param {Object} config the bar chart configuration
   */
  constructor(config: BarConfiguration) {
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
  determineAxesOffsets(x: Scale, y: Scale, root: NodeSelection, size: [number, number]) {
    const xNode = AxesUtil.drawXAxis(x, root, size, this.config.axes.groupx).node();
    const yNode = AxesUtil.drawYAxis(y, this.config.axes.y, root, this.config.position[1]).node();
    const result = [yNode.getBoundingClientRect().width, xNode.getBoundingClientRect().height];
    xNode.parentNode.removeChild(xNode);
    yNode.parentNode.removeChild(yNode);
    return result;
  }

  /**
   * Render the timeseries to the given root node.
   * @param  {d3.selection} root the root node
   */
  render(root: NodeSelection) {
    if (!this.config || !this.config.data || this.config.data.data.length === 0) {
      // refuse to render chart without data
      return;
    }
    if (this.config.backgroundColor) {
      root.style('background-color', this.config.backgroundColor);
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
      .attr('transform', d => `translate(${x(d.value.toString())},0)`)
      .attr('class', '.bar-group')
      .attr('value', d => d.value);

    const bars = this.renderBars(shapes as unknown as NodeSelection, groupedx, y);
    this.renderUncertainty(bars as unknown as NodeSelection, groupedx, y);
    this.renderLabels(bars as unknown as NodeSelection, groupedx, y);

    AxesUtil.drawXAxis(x, root, this.config.size, this.config.axes.groupx)
      .attr('transform', `translate(${offsets[0]}, ${this.config.size[1] - offsets[1]})`);
    AxesUtil.drawYAxis(y, this.config.axes.y, root, 0);

    BaseUtil.addBackground(g, this.config.position[0], this.config, this.chartSize);
    BaseUtil.addTitle(root, this.config, this.config.position[0] + offsets[0]);
    this.rootNode = g;

    const padding = this.config.axes.groupx.labelPadding;

    root.attr('viewBox',
      `0 0 ${this.chartSize[0] + offsets[0] + (padding ? padding : 0)} ${this.chartSize[1] + offsets[1]}`)
      .attr('width', this.chartSize[0] + offsets[0] + (padding ? padding : 0))
      .attr('height', this.chartSize[1] + offsets[1] + this.config.yOffset);

    this.config.groupsInitiallyHidden.forEach(val => this.toggleGroup(val));
    this.config.groupedInitiallyHidden.forEach(val => this.toggleGrouped(val));
  }

  /**
   * Render bar labels.
   * @param  {d3.selection} bars the selection to render the labels at
   * @param  {d3.scale} x the x scale
   * @param  {d3.scale} y the y scale
   */
  renderLabels(bars: NodeSelection, x: ScaleBand<string>, y: Scale) {
    bars.append('text')
      .text((d: BarChartDataItem) => d.label)
      .attr('transform', (d: BarChartDataValue) => {
        const chartSize = this.chartSize;
        const translateX = x(d.index.toString()) + (x.bandwidth() / 2);
        const translateY = d.belowThreshold ? chartSize[1] - 5 : (y(d.value as any) - 5 || chartSize[1]);
        return `translate(${translateX}, ${translateY})${this.config.rotateBarLabel ? ' rotate(-90)' : ''}`;
      })
      .attr('class', (d: BarChartDataValue) => `${d.belowThreshold ? 'below-threshold' : 'above-threshold'}`)
      .attr('text-anchor', 'middle')
      .style('font-family', 'sans-serif')
      .style('font-size', '11px')
      .style('fill', '#000')
      .style('font-weight', 'bold')
      .style('unselectable', 'on');

    if (this.config.rotateBarLabel) {
      bars.selectAll('text')
        .attr('dy', (d, idx, el) => (el[0] as Element).clientHeight / 4)
        .attr('dx', (d, idx, el) => {
          if (this.config.showLabelInsideBar) {
            const textElWidth = (el[0] as Element).clientWidth;
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
  renderBars(shapes: NodeSelection, x: ScaleBand<string>, y: Scale) {
    const bars = shapes.selectAll('rect')
      .data((d: BarChartDataItem) => d.values)
      .enter()
      .append('g')
      .attr('value', d => d.index);

    bars
      .append('rect')
      .style('fill', d => d.color)
      .style('display', d => d.belowThreshold ? 'none' : 'block')
      .attr('class', d => d.belowThreshold ? 'below-threshold' : 'above-threshold')
      .attr('x', d => x(d.index.toString()))
      .attr('y', d => y(d.value as any))
      .attr('width', x.bandwidth())
      .attr('height', d => this.chartSize[1] - y(d.value as any))
      .on('mouseover', (d, idx, brs) => {
        if (d.tooltipFunc) {
          d.tooltipFunc(brs[idx]);
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
  renderUncertainty(node: NodeSelection, x: ScaleBand<string>, y: Scale) {
    node
      .append('path')
      .attr('class', 'bar-uncertainty')
      .attr('d', (d: BarChartDataValue) => {
        if (d.uncertainty && d.uncertainty > 0) {
          const lineWidth = x.bandwidth() / 3;
          const xCenter = x(d.index.toString()) + x.bandwidth() / 2;
          const topVal = d.value + (d.value / 100 * d.uncertainty);
          let bottomVal = d.value - (d.value / 100 * d.uncertainty);

          if (bottomVal < 0) {
            bottomVal = 0;
          }

          const yTop = y(topVal as any);
          const yBottom = y(bottomVal as any);

          return `M${xCenter - lineWidth},${yBottom}L${xCenter + lineWidth},${yBottom}` +
            `M${xCenter},${yBottom}L${xCenter},${yTop}` +
            `M${(xCenter - lineWidth)},${yTop}L${xCenter + lineWidth},${yTop}`;
        }
        return undefined;
      })
      .attr('stroke', (d: BarChartDataValue) => d3color(d.color).darker().toString())
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 2);
  }

  /**
   * Toggle the group with the given index.
   * @param  {any} index the x value of the group
   * @return true, if the group's bars are now visible
   */
  toggleGroup(index: string) {
    const node = this.rootNode.select(`[value="${index}"]`);
    if (node.attr('visible') === 'false') {
      node.style('display', 'block');
      node.attr('visible', 'true');
    } else {
      node.style('display', 'none');
      node.attr('visible', 'false');
    }
    return node.attr('visible') === 'true';
  }

  /**
   * Toggle the grouped bars with the given index.
   * @param  {any} index the x value of the bars
   * @return true, if the grouped bars are now visible
   */
  toggleGrouped(index: string) {
    const node = this.rootNode.selectAll(`[value="${index}"]`);
    if (node.attr('visible') === 'false') {
      node.style('display', 'block');
      node.attr('visible', 'true');
    } else {
      node.style('display', 'none');
      node.attr('visible', 'false');
    }
    return node.attr('visible') === 'true';
  }

  /**
   * Set visibility of the uncertainty bar.
   * @param {Boolean} visible whether the uncertainty should be visible
   */
  setUncertaintyVisible(visible: boolean) {
    const node = this.rootNode.selectAll('.bar-uncertainty');
    node.style('display', visible ? 'block' : 'none');
  }

}

export default BarComponent;
