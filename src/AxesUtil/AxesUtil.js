import LabelUtil from '../LabelUtil/LabelUtil';
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
import {axisBottom, axisLeft} from 'd3-axis';
import {format} from 'd3-format';
import select from 'd3-selection/src/select';

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
    // return early if no config is present
    if (!config) {
      return;
    }
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

    let ticks = config.ticks;
    let tickValues = config.tickValues;

    // useful mainly for harmonized log scales on y axis
    if (config.autoTicks) {
      ticks = 9;
      tickValues = [];
      let cur = scale.domain()[1];
      // special case to avoid miny = 0 on log scales
      if (cur < 1) {
        cur = 0;
      }
      for (let i = 1; i <= ticks; ++i) {
        cur += scale.domain()[0] / 10;
        if (scale.domain()[0] >= cur && scale.domain()[1] <= cur) {
          tickValues.push(cur);
        }
      }
    }

    const x = axisFunc(scale)
      .tickFormat(tickFormatter);
    if (ticks) {
      x.ticks(ticks);
    }
    if (tickValues) {
      x.tickValues(tickValues);
    }
    if (config.tickSize) {
      x.tickSize(config.tickSize);
    }
    if (config.tickPadding) {
      x.tickPadding(config.tickPadding);
    }
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
    return this.createAxis(config, scale, axisLeft);
  }

  /**
   * Creates an d3 axis from the given scale.
   * @param  {d3.scale} y the y scale
   * @param  {object} config the axis configuration
   * @param  {selection} selection the d3 selection to append the axes to
   * @param  {number} yPosition the y offset
   */
  static drawYAxis(y, config, selection, yPosition) {
    if (!config || !config.display) {
      return;
    }
    const yAxis = AxesUtil.createYAxis(config, y);

    let pad = config.labelSize || 13;
    if (config.labelPadding) {
      pad += config.labelPadding;
    }

    if (!config.label) {
      pad = 0;
    }

    const axis = selection.append('g')
      .attr('class', 'y-axis');
    axis.append('g')
      .attr('transform', `translate(${pad}, 0)`)
      .call(yAxis);

    const box = axis.node().getBoundingClientRect();
    axis.attr('transform', `translate(${box.width}, ${yPosition})`);
    if (config.label) {
      axis.append('text')
        .attr('transform', `rotate(-90)`)
        .attr('x', -box.height / 2)
        .attr('y', (config.labelSize || 13) - box.width)
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
    selection.selectAll('.x-axis text').call(LabelUtil.wordWrap, 40, 0, 0);

    if (config.labelRotation) {
      axis.selectAll('text')
        .attr('transform', `rotate(${config.labelRotation})`)
        .attr('dx', '-10px')
        .attr('dy', '1px')
        .style('text-anchor', 'end');
    }
    return axis;
  }

  /**
   * Remove overlapping axis labels for a given axis node.
   * @param {d3.selection} node the axis node
   */
  static sanitizeAxisLabels(node) {
    const nodes = node.selectAll('.tick text');

    // need to sort the nodes first as the DOM order varies between scale types
    // (log scale seems to put lowest values first)
    const list = [];
    nodes.each((text, idx, nodeList) => {
      list.push(nodeList[idx]);
    });
    list.sort((a, b) => {
      const abox = a.getBoundingClientRect();
      const bbox = b.getBoundingClientRect();
      return abox.top - bbox.top;
    });

    let lastPos;
    list.forEach(text => {
      const box = text.getBoundingClientRect();
      if (lastPos && box.top < lastPos) {
        select(text).remove();
      } else {
        lastPos = box.top + box.height;
      }
    });
  }

}

export default AxesUtil;
