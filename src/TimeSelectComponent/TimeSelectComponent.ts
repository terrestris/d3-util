import { axisBottom } from 'd3-axis';
import { scaleLinear } from 'd3-scale';
import AxesUtil from '../AxesUtil/AxesUtil';
import { NodeSelection } from '../BaseUtil/BaseUtil';
import { ChartComponent, ZoomType } from '../ChartRenderer/ChartRenderer';

export interface TimeSelectConfiguration {
  resolution: number; // in minutes
  data: number[]; // in milliseconds
  color: string;
  duration: number; // in milliseconds
  page: number;
}

/**
 * A component that can be used in the chart renderer to render a time select
 * chart.
 */
class TimeSelectComponent implements ChartComponent {

  config: TimeSelectConfiguration;

  aggregatedData: {
    time: number,
    count: number
  }[] = [];

  maxCount: number = Number.MIN_SAFE_INTEGER;

  pages: number = 0;

  /**
   * Constructs a new time select component with a given configuration.
   * @param {object} config a configuration object
   */
  constructor(config: TimeSelectConfiguration) {
    this.config = config;
    this.aggregateData();
  }

  /**
   * Aggregates the input data according to the configured resolution.
   */
  aggregateData() {
    this.config.data.sort((a, b) => a - b);
    const resolution = this.config.resolution * 60000;
    this.pages = (this.config.data[this.config.data.length - 1] - this.config.data[0]) / this.config.duration;
    const maxx = this.config.data[this.config.data.length - 1] - (this.pages - this.config.page - 1) * this.config.duration;
    const minx = maxx - this.config.duration;
    let cur = minx;
    let curObject = {
      time: cur + resolution / 2,
      count: 0
    };
    const data = this.config.data.filter(val => val >= minx && val <= maxx);
    this.aggregatedData.push(curObject);
    data.forEach(val => {
      if (val < cur + resolution) {
        this.maxCount = Math.max(this.maxCount, ++curObject.count);
      } else {
        while (val >= cur + resolution) {
          cur += resolution;
          this.aggregatedData.push(curObject = {
            time: cur + resolution / 2,
            count: 0
          });
        }
        this.maxCount = Math.max(this.maxCount, ++curObject.count);
      }
    });
  }

  getPages() {
    return this.pages;
  }

  setPage(page: number) {
    this.config.page = page;
    this.aggregateData();
  }

  render(root: NodeSelection, size?: [number, number]) {
    size = size.slice() as [number, number];
    size[1] = size[1] - 20;
    const x = scaleLinear()
      .range([0, size[0]])
      .domain([this.aggregatedData[0].time, this.aggregatedData[this.aggregatedData.length - 1].time]);
    const y = scaleLinear()
      .range([size[1], 0])
      .domain([0, this.maxCount]);

    const axis = axisBottom(x);
    axis.tickFormat(AxesUtil.getMultiScaleTimeFormatter('de'));
    root
      .append('g')
      .attr('transform', `translate(0, ${size[1]})`)
      .call(axis);

    root
      .selectAll('rect')
      .data(this.aggregatedData)
      .enter()
      .append('rect')
      .style('fill', () => this.config.color)
      .attr('x', d => x(d.time))
      .attr('y', d => y(d.count))
      .attr('width', 10)
      .attr('height', d => size[1] - y(d.count));
  }

  enableZoom?: (root: NodeSelection, zoomType: ZoomType) => void;
  resetZoom?: () => void;

}

export default TimeSelectComponent;
