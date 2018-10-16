import moment from 'moment';
import {
  timeFormat
} from 'd3-time-format';
import {
  timeSecond,
  timeMinute,
  timeHour,
  timeDay,
  timeMonth,
  timeWeek,
  timeYear
} from 'd3-time';
import {axisBottom, axisRight} from 'd3-axis';
import {format} from 'd3-format';

/**
 * Class with helper functions to create/manage chart axes.
 */
class AxesUtil {

  /**
   * Method that can be adjusted to generate a custom multi scale time formatter
   * function, based on https://github.com/d3/d3-time-format
   *
   * See https://github.com/d3/d3-time-format/blob/master/README.md#locale_format
   * for available D3 datetime formats.
   *
   * @param  {Date} date The current Date object.
   * @return {function} The multi-scale time format function.
   */
  static getMultiScaleTimeFormatter(date) {
    date = moment(date);

    const formatMillisecond = timeFormat('.%L');
    const formatSecond = timeFormat(':%S');
    const formatMinute = timeFormat('%H:%M');
    const formatHour = timeFormat('%H:%M');
    const formatDay = timeFormat('%a %d');
    const formatWeek = timeFormat('%b %d');
    const formatMonth = timeFormat('%B');
    const formatYear = timeFormat('%Y');

    return (timeSecond(date) < date ? formatMillisecond
      : timeMinute(date) < date ? formatSecond
        : timeHour(date) < date ? formatMinute
          : timeDay(date) < date ? formatHour
            : timeMonth(date) < date ? (timeWeek(date) < date ? formatDay : formatWeek)
              : timeYear(date) < date ? formatMonth
                : formatYear)(date);
  }

  /**
   * Create an axis.
   * @param {Object} config the axis configuration
   * @param {d3.scale} scale the d3 scale object
   * @param {Function} axisFunc the axis function to create
   * @return {Boolean} the d3 axis object
   */
  static createAxis(config, scale, axisFunc) {
    let tickFormatter;
    if (config.scale === 'time') {
      tickFormatter = this.getMultiScaleTimeFormatter;
    } else if (config.scale === 'band') {
      // a numeric format makes no sense here
      tickFormatter = s => s;
    } else if (config.format) {
      tickFormatter = format(config.format);
    } else {
      tickFormatter = s => s;
    }
    const x = axisFunc(scale)
      .ticks(config.ticks)
      .tickValues(config.tickValues)
      .tickFormat(tickFormatter)
      .tickSize(config.tickSize)
      .tickPadding(config.tickPadding);
    return x;
  }

  /**
   * Create an x axis.
   * @param  {Object} config the axis configuration
   * @param {d3.scale} scale the d3 scale object
   * @return {d3.axis} the d3 axis object
   */
  static createXAxis(config, scale) {
    return this.createAxis(config, scale, axisBottom);
  }

  /**
   * Creates an y axis.
   * @param  {Object} config the axis configuration
   * @param  {d3.scale} scale the d3 scale object
   * @return {d3.axis} the d3 axis object
   */
  static createYAxis(config, scale) {
    return this.createAxis(config, scale, axisRight);
  }

  /**
   * Creates an d3 axis from the given scale.
   * @param  {d3.scale} y the y scale
   * @param  {object} config the axis configuration
   * @param  {selection} selection the d3 selection to append the axes to
   */
  static drawYAxis(y, config, selection) {
    if (!config.display) {
      return;
    }
    const yAxis = AxesUtil.createYAxis(config, y);

    let pad = config.labelSize || 13;
    if (config.labelPadding) {
      pad += config.labelPadding;
    }

    const axis = selection.append('g')
      .attr('class', 'y-axis');
    axis.append('g')
      .attr('transform', `translate(${pad}, 0)`)
      .call(yAxis);
    if (config.label) {

      axis.append('text')
        .attr('transform', `rotate(-90)`)
        .attr('x', -axis.node().getBBox().height / 2)
        .attr('y', config.labelSize || 13)
        .style('text-anchor', 'middle')
        .style('font-size', config.labelSize || 13)
        .style('fill', config.labelColor)
        .text(config.label);
    }
    return axis;
  }

  /**
   * Creates the x axis for a chart.
   * @param  {d3.scale} x the d3 scale
   * @param  {d3.selection} selection the d3 selection to add the axis to
   * @param  {number[]} size the remaining chart size
   * @param  {Object} config the axis configuration
   */
  static drawXAxis(x, selection, size, config) {
    const xAxis = AxesUtil.createXAxis(config, x);

    const axis = selection.insert('g', ':first-child')
      .attr('class', 'x-axis')
      .call(xAxis);

    if (config.labelRotation) {
      axis.selectAll('text')
        .attr('transform', `rotate(${config.labelRotation})`)
        .attr('dx', '-10px')
        .attr('dy', '1px')
        .style('text-anchor', 'end');
    }
    return axis;
  }

}

export default AxesUtil;
