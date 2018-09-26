import ChartDataUtil from '../ChartDataUtil/ChartDataUtil';
import ScaleUtil from '../ScaleUtil/ScaleUtil';
import AxesUtil from '../AxesUtil/AxesUtil';
import scaleLinear from 'd3-scale/src/linear';
import scaleTime from 'd3-scale/src/time';
import zoom from 'd3-zoom/src/zoom';
import {event} from 'd3-selection/src/selection/on';
import d3line from 'd3-shape/src/line.js';
import d3tip from 'd3-tip';

/**
 * A component that can be used in the chart renderer to render a timeseries
 * chart.
 */
class TimeseriesComponent {

  config = {
    series: [],
    zoomEnabled: true,
    backgroundColor: null,
    startDate: null,
    endDate: null,
    size: [100, 100],
    chartMargin: {
      top: null,
      right: null,
      bottom: null,
      left: null
    }
  }

  /**
   * Constructs a new timeseries component with a given configuration.
   * @param {object} config a configuration object
   */
  constructor(config) {
    this.config = config;
    this.fillDefaults(config);
  }

  /**
   * Fills in missing default values into the configuration.
   * @param  {object} config the object to fill the defaults in
   */
  fillDefaults(config) {
    config.series.forEach(line => {
      if (!line.color) {
        line.color = '#';
        [0, 1, 2, 3, 4, 5].forEach(() => line.color += '0123456789ABCDEF'[Math.floor(Math.random() * 16)]);
      }
      if (!line.scaleX) {
        line.scaleX = 'linear';
      }
      if (!line.scaleY) {
        line.scaleY = 'linear';
      }
    });
  }

  /**
   * Render the dots of the timeseries.
   * @param  {d3.selection} g the g node to render the dots into
   * @param  {object} line the series configuration
   * @param  {number} idx the series index
   * @param  {d3.scale} x the x scale
   * @param  {d3.scale} y the y scale
   */
  renderDots(g, line, idx, x, y) {
    const tip = d3tip().attr('class', 'd3-tip').html(d => d[1]);

    g.call(tip);

    g.selectAll(`circle.series-${idx}`)
      .data(line.data)
      .enter()
      .filter(d => d)
      .append('circle')
      .attr('class', `series-${idx}`)
      .attr('cx', d => x(d[0]))
      .attr('cy', d => y(d[1]))
      .attr('r', '5px')
      .attr('fill', line.color)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);
  }

  /**
   * Connect the dots with a line.
   * @param  {d3.selection} g the g node to render the line into
   * @param  {object} line the series configuration
   * @param  {number} idx the series index
   * @param  {d3.scale} x the x scale
   * @param  {d3.scale} y the y scale
   */
  renderLine(g, line, idx, x, y) {
    const lineData = ChartDataUtil.lineDataFromPointData(line.data);
    lineData.forEach(data => {
      const generator = d3line()
        .x(d => x(d[0]))
        .y(d => y(d[1]));

      g.append('path')
        .datum(data)
        .attr('d', generator)
        .attr('class', `series-${idx}`)
        .style('fill', 'none')
        .style('stroke', line.color);
    });
  }

  /**
   * Create a d3 scale object.
   * @param  {string} type the type of scale to create
   * @param  {number} size the size (width or height) of the chart
   * @param  {number[]} data the data to create the scale for
   * @param  {boolean} reverse whether to invert the scale
   * @return {d3.scale} the d3 scale object
   */
  createScale(type, size, data, reverse) {
    let scale;
    switch (type) {
      case 'linear': scale = scaleLinear();
        break;
      case 'time': scale = scaleTime();
    }
    scale.range([10, size - 10]);
    ScaleUtil.setDomainForScale({scale: type}, scale, data.filter(d => d), reverse);
    return scale;
  }

  /**
   * Creates an d3 axis from the given scale.
   * @param  {d3.scale} y the y scale
   * @param  {object} series the series configuration
   * @param  {selection} selection the d3 selection to append the axes to
   * @param  {number[]} size the chart size
   */
  drawYAxis(y, series, selection, size) {
    const yAxis = AxesUtil.createYAxis(series.scaleY, y);

    const prevAxes = selection.selectAll('.y-axis').nodes();
    const width = prevAxes.reduce((acc, node) => acc + node.getBBox().width, 0) + 5 * prevAxes.length;

    const axis = selection.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${width}, 0)`)
      .call(yAxis);
    if (series.yAxisLabel) {
      axis.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -size[1] / 2)
        .attr('y', -20)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', series.color)
        .text(series.yAxisLabel);
    }
  }

  /**
   * Creates the x axis for a chart.
   * @param  {d3.scale} x the d3 scale
   * @param  {d3.selection} selection the d3 selection to add the axis to
   * @param  {number[]} size the remaining chart size
   * @param  {number} width the x offset to draw the chart at
   */
  drawXAxis(x, selection, size, width) {
    const xAxis = AxesUtil.createXAxis(this.config.scaleX, x);

    selection.append('g')
      .attr('transform', `translate(${width}, ${size[1]})`)
      .attr('class', 'x-axis')
      .call(xAxis);
  }

  /**
   * Enables zoom on the chart.
   * @param {d3.selection} root the node for which to enable zoom
   * @param {number[]} size the chart size
   */
  enableZoom(root, size) {
    this.zoomBehaviour = zoom()
      .scaleExtent([1, 10])
      .on('zoom', () => {
        const transform = event.transform;
        this.mainScaleX = transform.rescaleX(this.originalScaleX);
        this.yScales = this.originalYScales.map(scale => transform.rescaleY(scale));
        if (this.config.zoomMode === 'transform') {
          root.selectAll('.x-axis').remove();
          root.selectAll('.y-axis').remove();
          root.selectAll('.timeseries circle,.timeseries path')
            .attr('transform', transform);
        }
        this.render(root, size, true);
      });
    root.call(this.zoomBehaviour);
  }

  /**
   * Render the timeseries to the given root node.
   * @param  {d3.selection} root the root node
   * @param  {number[]} size the size of the svg
   * @param  {boolean} rerender if true, rerendering mode is enabled
   */
  render(root, size, rerender) {
    let g = root.selectAll('g.timeseries');
    if (!g.node()) {
      g = root.append('g').attr('class', 'timeseries');
    }
    if (rerender && this.config.zoomMode !== 'transform') {
      g.remove();
      g = root.append('g').attr('class', 'timeseries');
    }
    const yScales = [];
    this.config.series.forEach((line, idx) => {
      let y = this.createScale(line.scaleY, this.config.size[1], line.data.filter(d => d).map(d => d[1]), true);
      if (rerender) {
        y = this.yScales[idx];
      }
      yScales.push(y);
      if (line.drawAxis) {
        this.drawYAxis(y, line, g, this.config.size);
      }
    });
    const axes = g.selectAll('.y-axis').nodes();
    const width = axes.reduce((acc, node) => acc + node.getBBox().width, 0) + 5 * axes.length;
    const xData = this.config.series.reduce((acc, line) => acc.concat(line.data.filter(d => d).map(d => d[0])), []);
    const x = rerender ? this.mainScaleX : this.createScale(this.config.scaleX, this.config.size[0] - width, xData, false);
    this.config.series.forEach((line, idx) => {
      if (rerender && this.config.zoomMode === 'transform') {
        return;
      }
      const y = yScales[idx];
      const dotsg = g.append('g').attr('transform', `translate(${width}, 0)`);
      const lineg = g.append('g').attr('transform', `translate(${width}, 0)`);
      this.renderDots(dotsg, line, idx, x, y);
      this.renderLine(lineg, line, idx, x, y);
    });
    this.drawXAxis(x, g, this.config.size, width);
    this.yScales = yScales;
    this.mainScaleX = x;
    if (!rerender) {
      this.enableZoom(root, this.config.size);
      this.originalScaleX = x;
      this.originalYScales = yScales;
    }
  }

}

export default TimeseriesComponent;
