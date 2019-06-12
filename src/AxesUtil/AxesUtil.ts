import LabelUtil from '../LabelUtil/LabelUtil';
import { timeFormatLocale } from 'd3-time-format';
import {
  timeSecond,
  timeMinute,
  timeHour,
  timeDay,
  timeMonth,
  timeWeek,
  timeYear
} from 'd3-time';
import { axisBottom, axisLeft, Axis, AxisDomain, AxisScale } from 'd3-axis';
import { ScaleLinear, ScaleLogarithmic } from 'd3-scale';
import { FormatLocaleDefinition, formatLocale } from 'd3-format';
import { select } from 'd3-selection';
import { TimeLocaleDefinition } from 'd3-time-format';
import { Moment } from 'moment';
import moment = require('moment');
import { Scale } from 'src/ScaleUtil/ScaleUtil';
import { NodeSelection } from 'src/BaseUtil/BaseUtil';
const deDE: TimeLocaleDefinition = require('d3-time-format/locale/de-DE.json');
const enUS: TimeLocaleDefinition = require('d3-time-format/locale/en-US.json');
const FormatdeDE: FormatLocaleDefinition = require('d3-format/locale/de-DE.json');
const FormatenUS: FormatLocaleDefinition = require('d3-format/locale/en-US.json');

export interface AxisConfiguration {
  labelRotation?: number;
  display?: boolean;
  labelSize?: number;
  labelPadding?: number;
  labelColor?: string;
  label?: string;
  ticks?: number;
  tickSize?: number;
  tickPadding?: number;
  tickValues?: number[];
  locale?: 'de' | 'en';
  autoTicks?: boolean;
  epsilon?: number;
  scale?: string;
  format?: string;
  min?: any;
  max?: any;
  harmonize?: boolean;
  factor?: number;
  orientation: 'x' | 'y';
  gridWidth?: string;
  gridColor?: string;
  showGrid?: boolean;
  gridOpacity?: number;
  sanitizeLabels?: boolean;
}

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
   * @param  {string} locale The desired locale (de or en currently)
   * @return {function} The multi-scale time format function.
   */
  static getMultiScaleTimeFormatter(locale: 'de' | 'en'): (date: Moment) => string {
    return (date: Moment) => {
      date = moment(date);
      const loc = locale.startsWith('de') ? timeFormatLocale(deDE) : timeFormatLocale(enUS);
      const formatMillisecond = loc.format('.%L');
      const formatSecond = loc.format(':%S');
      const formatMinute = loc.format('%H:%M');
      const formatHour = loc.format('%H:%M');
      const formatDay = loc.format('%a %d');
      const formatWeek = loc.format('%b %d');
      const formatMonth = loc.format('%B');
      const formatYear = loc.format('%Y');

      return (timeSecond(date.toDate()) < date.toDate() ? formatMillisecond
        : timeMinute(date.toDate()) < date.toDate() ? formatSecond
          : timeHour(date.toDate()) < date.toDate() ? formatMinute
            : timeDay(date.toDate()) < date.toDate() ? formatHour
              : timeMonth(date.toDate()) < date.toDate() ?
                (timeWeek(date.toDate()) < date.toDate() ? formatDay : formatWeek)
                : timeYear(date.toDate()) < date.toDate() ? formatMonth
                  : formatYear)(date.toDate());
    };
  }

  /**
   * Create an axis.
   * @param {Object} config the axis configuration
   * @param {d3.scale} scale the d3 scale object
   * @param {Function} axisFunc the axis function to create
   * @return {Boolean} the d3 axis object
   */
  static createAxis(
    config: AxisConfiguration,
    scale: Scale,
    axisFunc: <Domain extends AxisDomain>(scale: AxisScale<Domain>) => Axis<Domain>
  ) {
    // return early if no config is present
    if (!config) {
      return undefined;
    }
    const locale = config.locale || 'en';
    const format = formatLocale(locale.startsWith('de') ? FormatdeDE : FormatenUS).format;
    let tickFormatter;
    if (config.scale === 'time') {
      tickFormatter = this.getMultiScaleTimeFormatter(config.locale || 'en');
    } else if (config.scale === 'band') {
      // a numeric format makes no sense here
      tickFormatter = (s: number) => s;
    } else if (config.format) {
      tickFormatter = format(config.format);
    } else {
      tickFormatter = (s: number) => s;
    }

    let ticks = config.ticks;
    let tickValues = config.tickValues;

    // useful mainly for harmonized log scales on y axis
    if (config.autoTicks) {
      ticks = 10;
      tickValues = [];
      let dom = scale.domain();

      if (typeof dom[0] === 'number' || dom[0] instanceof Number) {
        dom = dom as number[];

        let min = dom[0] < dom[1] ? dom[0] : dom[1];
        let max = dom[0] > dom[1] ? dom[0] : dom[1];

        if (config.harmonize) {
          min = Math.pow(10, Math.floor(Math.log(min) * Math.LOG10E));
          max = Math.pow(10, Math.ceil(Math.log(max) * Math.LOG10E));
        }

        let cur: number = min;
        // special case to avoid miny = 0 on log scales
        if (cur < 1) {
          cur = 0;
        }

        for (let i = 1; i <= ticks; ++i) {
          cur += max / ticks;
          if (max >= cur && min <= cur) {
            tickValues.push(cur);
          }
        }
      }
    }

    const x = axisFunc(scale as ScaleLinear<number, number> | ScaleLogarithmic<number, any>)
      .tickFormat(tickFormatter as null);
    if (ticks !== undefined) {
      x.ticks(ticks);
    }
    if (tickValues !== undefined) {
      x.tickValues(tickValues);
    }
    if (config.tickSize !== undefined) {
      x.tickSize(config.tickSize);
    }
    if (config.tickPadding !== undefined) {
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
  static createXAxis(config: AxisConfiguration, scale: Scale) {
    return this.createAxis(config, scale, axisBottom);
  }

  /**
   * Creates an y axis.
   * @param  {Object} config the axis configuration
   * @param  {d3.scale} scale the d3 scale object
   * @return {d3.axis} the d3 axis object
   */
  static createYAxis(config: AxisConfiguration, scale: Scale) {
    return this.createAxis(config, scale, axisLeft);
  }

  /**
   * Creates an d3 axis from the given scale.
   * @param  {d3.scale} y the y scale
   * @param  {object} config the axis configuration
   * @param  {selection} selection the d3 selection to append the axes to
   * @param  {number} yPosition the y offset
   */
  static drawYAxis(
    y: Scale,
    config: AxisConfiguration,
    selection: NodeSelection,
    yPosition: number
  ): NodeSelection | undefined {
    if (!config || !config.display) {
      return undefined;
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
  static drawXAxis(
    x: Scale,
    selection: NodeSelection,
    size: [number, number],
    config: AxisConfiguration
  ): NodeSelection {
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
  static sanitizeAxisLabels(node: NodeSelection) {
    const nodes = node.selectAll('.tick text');

    // need to sort the nodes first as the DOM order varies between scale types
    // (log scale seems to put lowest values first)
    const list: HTMLElement[] = [];
    nodes.each((_, idx, nodeList) => {
      list.push(nodeList[idx] as HTMLElement);
    });
    list.sort((a, b) => {
      const abox = a.getBoundingClientRect();
      const bbox = b.getBoundingClientRect();
      return abox.top - bbox.top;
    });

    let lastPos: number;
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
