/*eslint-env jest*/

import AxesUtil, { AxisConfiguration } from './AxesUtil';
import * as moment from 'moment';
import { scaleLinear, scaleLog } from 'd3-scale';
import { select } from 'd3-selection';

describe('AxesUtil', () => {

  it('is defined', () => {
    expect(AxesUtil).not.toBeUndefined();
  });

  it('returns a string when formatting time', () => {
    const fn = AxesUtil.getMultiScaleTimeFormatter('en')(moment());
    expect((typeof fn) === 'string').toEqual(true);
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-31T13:26:59.889');
    expect(AxesUtil.getMultiScaleTimeFormatter('en')(date)).toEqual('.889');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-31T13:26:59.000');
    expect(AxesUtil.getMultiScaleTimeFormatter('en')(date)).toEqual(':59');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-31T13:26:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter('en')(date)).toEqual('13:26');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-31T00:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter('en')(date)).toEqual('Wed 31');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-31T00:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter('de')(date)).toEqual('Mi 31');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-01T00:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter('en')(date)).toEqual('October');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-01T00:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter('de')(date)).toEqual('Oktober');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-01-01T00:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter('en')(date)).toEqual('2018');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-20T01:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter('en')(date)).toEqual('01:00');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-21T00:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter('en')(date)).toEqual('Oct 21');
  });

  it('can create d3 axis objects', () => {
    const result = AxesUtil.createXAxis({} as AxisConfiguration, scaleLinear());
    expect((typeof result) === 'function').toEqual(true);
    expect((typeof result.scale) === 'function').toEqual(true);
  });

  it('can create d3 axis objects', () => {
    const result = AxesUtil.createYAxis({} as AxisConfiguration, scaleLinear());
    expect((typeof result) === 'function').toEqual(true);
    expect((typeof result.scale) === 'function').toEqual(true);
  });

  it('will not fail for undefined axis config', () => {
    expect(AxesUtil.createXAxis.bind(AxesUtil)).not.toThrow();
  });

  it('will handle the auto ticks flag', () => {
    const result = AxesUtil.createYAxis({
      scale: 'time',
      autoTicks: true
    } as AxisConfiguration, scaleLinear());
    expect((typeof result) === 'function').toEqual(true);
    expect((typeof result.scale) === 'function').toEqual(true);
  });

  it('can create d3 axis objects with custom format', () => {
    const result = AxesUtil.createXAxis({
      format: '04d'
    } as AxisConfiguration, scaleLinear());
    expect((typeof result) === 'function').toEqual(true);
    expect((typeof result.scale) === 'function').toEqual(true);
  });

  it('will fail to create a d3 axis object with broken format', () => {
    expect(() => {
      AxesUtil.createXAxis({
        format: 'zzz'
      } as AxisConfiguration, scaleLinear());
    }).toThrow();
  });

  it('will handle the auto ticks flag for log scales', () => {
    const result = AxesUtil.createYAxis({
      scale: 'log',
      autoTicks: true
    } as AxisConfiguration, scaleLog().domain([0.2, 0.1]));
    expect((typeof result) === 'function').toEqual(true);
    expect((typeof result.scale) === 'function').toEqual(true);
  });

  it('will skip drawing an axis if config is not set or set to be hidden', () => {
    expect(AxesUtil.drawYAxis).not.toThrow();
    expect(() => AxesUtil.drawYAxis(undefined, {display: false} as AxisConfiguration, undefined, undefined))
      .not.toThrow();
  });

  it('respects the label padding parameter', () => {
    const y = scaleLinear().domain([0, 10]);
    const svg = document.createElement('svg');
    document.body.append(svg);
    const axis = AxesUtil.drawYAxis(y, {
      label: 'test',
      labelPadding: 20,
      display: true
    } as AxisConfiguration, select(svg), 10);
    expect(axis).not.toBeUndefined();
    const transform = axis.select('g[transform]').attr('transform');
    expect(transform).toEqual('translate(33, 0)');
  });

  it('can draw an x axis and rotate the labels', () => {
    const x = scaleLinear().domain([0, 10]);
    const svg = document.createElement('svg');
    document.body.append(svg);
    const axis = AxesUtil.drawXAxis(x, select(svg), undefined, {
      labelRotation: 45,
      display: true
    } as AxisConfiguration);
    expect(axis).not.toBeUndefined();
    expect(axis.select('text').attr('transform')).toEqual('rotate(45)');
  });

  it('can sanitize axis labels', () => {
    const y = scaleLinear().domain([0, 10]);
    const svg = document.createElement('svg');
    document.body.append(svg);
    const axis = AxesUtil.drawYAxis(y, {
      label: 'test',
      labelPadding: 20,
      display: true
    } as AxisConfiguration, select(svg), 10);
    AxesUtil.sanitizeAxisLabels(axis);
  });

});
