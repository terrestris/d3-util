import ChartDataUtil from '../ChartDataUtil/ChartDataUtil';
import ScaleUtil from '../ScaleUtil/ScaleUtil';
import scaleLinear from 'd3-scale/src/linear';

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
   * Creates the d3 scale objects.
   * @param  {object} series the series to get the scales for
   * @param  {array} size the size of the chart
   * @return {array} an array with the x and y scales
   */
  createScales(series, size) {
    let x;
    let y;
    switch (series.scaleX) {
      case 'linear': {
        x = scaleLinear()
          .range([0, size[0]]);
        ScaleUtil.setDomainForScale({scale: series.scaleX}, x, series.data.filter(d => d).map(d => d[0]));
      }
    }
    switch (series.scaleY) {
      case 'linear': {
        y = scaleLinear()
          .range([0, size[1]]);
        ScaleUtil.setDomainForScale({scale: series.scaleY}, y, series.data.filter(d => d).map(d => d[1]));
      }
    }
    return [x, y];
  }

  /**
   * Render the timeseries to the given root node.
   * @param  {d3.selection} root the root node
   * @param  {array} size the size of the svg
   */
  render(root, size) {
    const g = root.append('g');
    this.config.series.forEach((line, idx) => {
      const [x, y] = this.createScales(line, size);
      this.renderDots(g, line, idx, x, y);
      this.renderLine(g, line, idx, x, y);
    });
  }

}

export default TimeseriesComponent;
