import { axisBottom } from 'd3-axis';
import { scaleLinear } from 'd3-scale';
import { brushX } from 'd3-brush';
import { event } from 'd3-selection';
import AxesUtil from '../AxesUtil/AxesUtil';
import { NodeSelection } from '../BaseUtil/BaseUtil';
import { ChartComponent, ZoomType } from '../ChartRenderer/ChartRenderer';
import * as moment from 'moment';

export interface TimeSelectConfiguration {
  resolution: number; // in minutes
  data: number[];
  color: string;
  selectedColor: string;
  hoverColor: string;
  duration: number; // in milliseconds
  page: number;
  selectedTime: number;
  selectedTimeRange: number[];
  useBrush: boolean;
  brushExtent: [[number, number], [number, number]];
  initialBrushSelection: [number, number];
  onSelectionChange: (startTime: number, endTime?: number) => undefined;
}

interface TimeSelectItem {
  time: number;
  count: number;
}

/**
 * A component that can be used in the chart renderer to render a time select
 * chart.
 */
class TimeSelectComponent implements ChartComponent {

  config: TimeSelectConfiguration;

  aggregatedData: TimeSelectItem[] = [];

  maxCount: number = Number.MIN_SAFE_INTEGER;

  pages: number = 0;

  selectedTime: number = 0;

  selectedTimeRange: number[] = [0, 0];

  brushExtent: [[number, number], [number, number]] = [[0, 0], [400, 180]];

  initialBrushSelection: [number, number] = [50, 350];

  /**
   * Constructs a new time select component with a given configuration.
   * @param {object} config a configuration object
   */
  constructor(config: TimeSelectConfiguration) {
    this.config = config;
    this.selectedTime = config.selectedTime;
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
      time: cur,
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
          if (curObject.count === 0) {
            this.aggregatedData.pop();
          }
          this.aggregatedData.push(curObject = {
            time: cur,
            count: 0
          });
        }
        this.maxCount = Math.max(this.maxCount, ++curObject.count);
      }
    });
    this.aggregatedData = this.aggregatedData.filter(d => d.count > 0);
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
    const res = this.config.resolution;
    const durationInMinutes = (this.aggregatedData[this.aggregatedData.length - 1].time -
      this.aggregatedData[0].time) / 1000 / 60;
    let formatString: string = 'DD.MM.YYYY';

    if (res <= 1440) {//resolution in hours or lower
      if (durationInMinutes < 1440 * 3 && durationInMinutes > 1440) {// duration between 1 and three days
        formatString = 'DD.MM.YYYY HH:mm';
      } else if (durationInMinutes <= 1440) {// the same day
        formatString = 'HH:mm';
      }
    }
    axis.tickFormat(function(time: number) {
      return moment(time).format(formatString);
    });

    root
      .append('g')
      .attr('transform', `translate(0, ${size[1]})`)
      .call(axis);

    AxesUtil.sanitizeAxisLabels(root, true);

    let bars: any;
    if  (this.config.useBrush) {
      const brush = brushX()
          .extent(this.config.brushExtent)
          .on('end', () => {
            const startDateTime = x.invert(event.selection[0]);
            const endDateTime = x.invert(event.selection[1]);
            this.selectedTimeRange = [startDateTime, endDateTime];
            this.config.onSelectionChange(startDateTime, endDateTime);
          });
      bars = root
        .selectAll('rect')
        .append('g')
        .data(this.aggregatedData)
        .enter()
        .append('rect')
        .style('fill', (d) => {
          let color = this.config.color;
          if (this.selectedTimeRange && this.selectedTimeRange.length === 2 &&
            d.time >= this.selectedTimeRange[0] && d.time <= this.selectedTimeRange[1]) {
              color = this.config.selectedColor;
          }
          return color;
        })
        .attr('x', d => x(d.time))
        .attr('y', d => y(d.count))
        .attr('width', 5)
        .attr('height', d => size[1] - y(d.count));
      let initialSelection = this.config.initialBrushSelection;
      if (this.config.selectedTimeRange) {
        // given timerange wins over initial selection
        initialSelection = [x(this.config.selectedTimeRange[0]), x(this.config.selectedTimeRange[1])];
      }
      root
        .call(brush)
        .call(brush.move, initialSelection)
    } else {
      bars = root
        .selectAll('rect')
        .data(this.aggregatedData)
        .enter()
        .append('rect')
        .style('fill', (d) => d.time === this.selectedTime ? this.config.selectedColor : this.config.color)
        .style('cursor', 'pointer')
        .attr('x', d => x(d.time))
        .attr('y', d => y(d.count))
        .attr('width', 5)
        .attr('height', d => size[1] - y(d.count))
        .on('mouseover', (d, index, elems) => {
          const elem = elems[index];
          if (this.selectedTime !== d.time) {
            elem.style.fill = this.config.hoverColor;
          }
        })
        .on('mouseleave', (d, index, elems) => {
          const elem = elems[index];
          if (d.time !== this.selectedTime) {
            elem.style.fill = this.config.color;
          }
        })
        .on('click', (d, index, elems) => {
          const elem = elems[index];
          if (this.selectedTime === d.time) {
            elem.style.fill = this.config.hoverColor;
            this.selectedTime = 0;
          } else {
            if (this.selectedTime !== 0) {
              bars.each((d: any, index: number, elems: any[]) => {
                if (d.time === this.selectedTime) {
                  elems[index].style.fill = this.config.color;
                }
              })
            }
            this.selectedTime = d.time;
            elem.style.fill = this.config.selectedColor;
          }
          this.config.onSelectionChange(d.time);
        });
    }
  }
  getSelectedTime = () => this.selectedTime;
  getSelectedTimeRange = () => this.selectedTimeRange;
  enableZoom?: (root: NodeSelection, zoomType: ZoomType) => void;
  resetZoom?: () => void;
}

export default TimeSelectComponent;
