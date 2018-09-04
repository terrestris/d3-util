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
   * Create an x axis.
   * @param  {string}  type  the type of the axis
   * @param  {d3.scale}  scale the d3 scale object
   * @return {d3.axis} the d3 axis object
   */
  static createXAxis(type, scale) {
    let tickFormatter;
    if (type === 'time') {
      tickFormatter = this.getMultiScaleTimeFormatter;
    } else {
      tickFormatter = s => s;
    }
    const x = axisBottom(scale).tickFormat(tickFormatter);
    return x;
  }

  /**
   * Creates an y axis.
   * @param  {string}  type  the type of the axis
   * @param  {d3.scale}  scale the d3 scale object
   * @return {d3.axis} the d3 axis object
   */
  static createYAxis(type, scale) {
    let tickFormatter;
    if (type === 'time') {
      tickFormatter = this.getMultiScaleTimeFormatter;
    } else {
      tickFormatter = s => s;
    }
    const y = axisRight(scale).tickFormat(tickFormatter);
    return y;
  }

}

export default AxesUtil;
