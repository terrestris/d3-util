import ChartDataUtil from '../ChartDataUtil/ChartDataUtil';
import ScaleUtil from '../ScaleUtil/ScaleUtil';
import AxesUtil from '../AxesUtil/AxesUtil';
import scaleLinear from 'd3-scale/src/linear';
import scaleTime from 'd3-scale/src/time';

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
    g.selectAll(`circle.series-${idx}`)
      .data(line.data)
      .enter()
      .filter(d => d)
      .append('circle')
      .attr('class', `series-${idx}`)
      .attr('cx', d => x(d[0]))
      .attr('cy', d => y(d[1]))
      .attr('r', '5px')
      .attr('fill', line.color);
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

    g.selectAll(`line.series-${idx}`)
      .data(lineData)
      .enter()
      .filter(d => d)
      .append('line')
      .attr('class', `series-${idx}`)
      .attr('x1', d => x(d[0]))
      .attr('y1', d => y(d[1]))
      .attr('x2', d => x(d[2]))
      .attr('y2', d => y(d[3]))
      .style('stroke', line.color);
  }

  /**
   * Create a d3 scale object.
   * @param  {string} type the type of scale to create
   * @param  {number[]} size the size of the chart
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
    scale.range([10, size[1] - 10]);
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
  drawYAxis(y, series, selection) {
    const yAxis = AxesUtil.createYAxis(series.scaleY, y);

    const prevAxes = selection.selectAll('.y-axis').nodes();
    const width = prevAxes.reduce((acc, node) => acc + node.getBBox().width, 0) + 5 * prevAxes.length;

    selection.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${width}, 0)`)
      .call(yAxis);
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
   * Render the timeseries to the given root node.
   * @param  {d3.selection} root the root node
   * @param  {number[]} size the size of the svg
   */
  render(root, size) {
    const g = root.append('g');
    this.config.series.forEach((line) => {
      const y = this.createScale(line.scaleY, size, line.data.filter(d => d).map(d => d[1]), true);
      if (line.drawAxis) {
        this.drawYAxis(y, line, g, size);
      }
    });
    const axes = g.selectAll('.y-axis').nodes();
    const width = axes.reduce((acc, node) => acc + node.getBBox().width, 0) + 5 * axes.length;
    const xData = this.config.series.reduce((acc, line) => acc.concat(line.data.filter(d => d).map(d => d[0])), []);
    const x = this.createScale(this.config.scaleX, [size[0] - width, size[1]], xData, false);
    this.config.series.forEach((line, idx) => {
      const y = this.createScale(line.scaleY, size, line.data.filter(d => d).map(d => d[1]));
      const dotsg = g.append('g').attr('transform', `translate(${width}, 0)`);
      const lineg = g.append('g').attr('transform', `translate(${width}, 0)`);
      this.renderDots(dotsg, line, idx, x, y);
      this.renderLine(lineg, line, idx, x, y);
    });
    this.drawXAxis(x, g, size, width);
  }

}

export default TimeseriesComponent;
