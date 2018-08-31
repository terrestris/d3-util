import ChartDataUtil from '../ChartDataUtil/ChartDataUtil';

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
   */
  renderDots(g, line, idx) {
    g.selectAll(`circle.series-${idx}`)
      .data(line.data)
      .enter()
      .filter(d => d)
      .append('circle')
      .attr('class', `series-${idx}`)
      .attr('cx', d => d[0])
      .attr('cy', d => d[1])
      .attr('r', '5px')
      .attr('fill', line.color);
  }

  /**
   * Connect the dots with a line.
   * @param  {d3.selection} g the g node to render the line into
   * @param  {object} line the series configuration
   * @param  {number} idx the series index
   */
  renderLine(g, line, idx) {
    const lineData = ChartDataUtil.lineDataFromPointData(line.data);

    g.selectAll(`line.series-${idx}`)
      .data(lineData)
      .enter()
      .filter(d => d)
      .append('line')
      .attr('class', `series-${idx}`)
      .attr('x1', d => d[0])
      .attr('y1', d => d[1])
      .attr('x2', d => d[2])
      .attr('y2', d => d[3])
      .style('stroke', line.color);
  }

  /**
   * Render the timeseries to the given root node.
   * @param  {d3.selection} root the root node
   */
  render(root) {
    const g = root.append('g');
    this.config.series.forEach((line, idx) => {
      this.renderDots(g, line, idx);
      this.renderLine(g, line, idx);
    });
  }

}

export default TimeseriesComponent;
