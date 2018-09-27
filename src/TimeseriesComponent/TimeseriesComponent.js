import ChartDataUtil from '../ChartDataUtil/ChartDataUtil';
import ScaleUtil from '../ScaleUtil/ScaleUtil';
import AxesUtil from '../AxesUtil/AxesUtil';
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
    this.originalScales = ScaleUtil.createScales(this.config);
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
   * Creates an d3 axis from the given scale.
   * @param  {d3.scale} y the y scale
   * @param  {object} series the series configuration
   * @param  {selection} selection the d3 selection to append the axes to
   * @param  {number[]} size the chart size
   */
  drawYAxis(y, series, selection, size) {
    const config = this.config.axes[series.axes[1]];
    const yAxis = AxesUtil.createYAxis(config, y);

    const prevAxes = selection.selectAll('.y-axis').nodes();
    let width = prevAxes.reduce((acc, node) => acc + node.getBBox().width, 0) + 5 * prevAxes.length;
    if (config.labelSize) {
      width += config.labelSize;
    } else if (config.label) {
      width += 13;
    }
    if (config.labelPadding) {
      width += config.labelPadding;
    }

    const axis = selection.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${width}, 0)`)
      .call(yAxis);
    if (config.label) {
      axis.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -size[1] / 2)
        .attr('y', -20)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('padding', config.labelPadding)
        .style('font-size', config.labelSize || 13)
        .style('fill', config.labelColor)
        .text(config.label);
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
    const config = Object.entries(this.config.axes).find(entry => entry[1].orientation === 'x')[1];
    const xAxis = AxesUtil.createXAxis(config, x);

    selection.append('g')
      .attr('transform', `translate(${width}, ${size[1]})`)
      .attr('class', 'x-axis')
      .call(xAxis);
  }

  /**
   * Enables zoom on the chart.
   * @param {d3.selection} root the node for which to enable zoom
   * @param {String} zoomType the zoom type
   */
  enableZoom(root, zoomType) {
    this.zoomType = zoomType;
    if (zoomType === 'none') {
      return;
    }

    this.zoomBehaviour = zoom()
      .scaleExtent([1, 10])
      .on('zoom', () => {
        const transform = event.transform;
        this.mainScaleX = transform.rescaleX(this.originalScales.XSCALE);
        this.yScales = Object.entries(this.originalScales)
          .filter(entry => this.config.axes[entry[0]] && this.config.axes[entry[0]].orientation === 'y')
          .map(entry => transform.rescaleY(entry[1]));
        if (zoomType === 'transform') {
          root.selectAll('.x-axis').remove();
          root.selectAll('.y-axis').remove();
          root.selectAll('.timeseries circle,.timeseries path')
            .attr('transform', transform);
        }
        this.render(root, this.config.size, true);
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
    if (!this.config.series || this.config.series.length === 0) {
      // refuse to render chart without series
      return;
    }
    let g = root.selectAll('g.timeseries');
    if (!g.node()) {
      g = root.append('g').attr('class', 'timeseries');
    }
    if (rerender && this.zoomType !== 'transform') {
      g.remove();
      g = root.append('g').attr('class', 'timeseries');
    }

    const yScales = this.prepareYAxes(rerender, g);
    const axes = g.selectAll('.y-axis').nodes();
    const width = axes.reduce((acc, node) => acc + node.getBBox().width, 0) + 5 * axes.length;
    const x = rerender ? this.mainScaleX : this.originalScales.XSCALE.range([0, this.config.size[0] - width]);

    this.renderSeries(rerender, g, x, yScales, width);
    this.drawXAxis(x, g, this.config.size, width);

    this.yScales = yScales;
    this.mainScaleX = x;
  }

  /**
   * Actually render the series (dots and lines).
   * @param {Boolean} rerender if rerender mode is enabled
   * @param {d3.selection} g the node to render to
   * @param {d3.scale} x the x scale
   * @param {d3.scale[]} yScales the y scales
   * @param {Number} width the x offset
   */
  renderSeries(rerender, g, x, yScales, width) {
    this.config.series.forEach((line, idx) => {
      if (rerender && this.zoomType === 'transform') {
        return;
      }
      const y = yScales[idx];
      const dotsg = g.append('g').attr('transform', `translate(${width}, 0)`);
      const lineg = g.append('g').attr('transform', `translate(${width}, 0)`);
      this.renderDots(dotsg, line, idx, x, y);
      this.renderLine(lineg, line, idx, x, y);
    });
  }

  /**
   * Prepares and renders y axis/scales.
   * @return {Function[]} the y scales in order of the series
   */
  prepareYAxes(rerender, g) {
    const yScales = [];
    const yAxesDrawn = [];
    this.config.series.forEach((line, idx) => {
      let y = this.originalScales[line.axes[1]];
      y.range([10, this.config.size[1] - 10]);
      if (rerender) {
        y = this.yScales[idx];
      }
      yScales.push(y);
      if (this.config.axes[line.axes[1]].display &&
        !yAxesDrawn.includes(line.axes[1])) {
        this.drawYAxis(y, line, g, this.config.size);
        yAxesDrawn.push(line.axes[1]);
      }
    });
    return yScales;
  }

}

export default TimeseriesComponent;
