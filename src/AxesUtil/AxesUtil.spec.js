/*eslint-env jest*/

import AxesUtil from './AxesUtil.js';
import moment from 'moment';
import scaleLinear from 'd3-scale/src/linear';

describe('AxesUtil', () => {

  it('is defined', () => {
    expect(AxesUtil).not.toBeUndefined();
  });

  it('returns a string when formatting time', () => {
    const fn = AxesUtil.getMultiScaleTimeFormatter();
    expect((typeof fn) === 'string').toEqual(true);
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-31T13:26:59.889');
    expect(AxesUtil.getMultiScaleTimeFormatter(date)).toEqual('.889');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-31T13:26:59.000');
    expect(AxesUtil.getMultiScaleTimeFormatter(date)).toEqual(':59');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-31T13:26:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter(date)).toEqual('13:26');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-31T00:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter(date)).toEqual('Wed 31');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-01T00:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter(date)).toEqual('October');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-01-01T00:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter(date)).toEqual('2018');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-20T01:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter(date)).toEqual('01:00');
  });

  it('returns the appropriate formatted time', () => {
    const date = moment('2018-10-21T00:00:00.000');
    expect(AxesUtil.getMultiScaleTimeFormatter(date)).toEqual('Oct 21');
  });

  it('can create d3 axis objects', () => {
    const result = AxesUtil.createXAxis({}, scaleLinear());
    expect((typeof result) === 'function').toEqual(true);
    expect((typeof result.scale) === 'function').toEqual(true);
  });

  it('can create d3 axis objects', () => {
    const result = AxesUtil.createYAxis({}, scaleLinear());
    expect((typeof result) === 'function').toEqual(true);
    expect((typeof result.scale) === 'function').toEqual(true);
  });

  it('will not fail for undefined axis config', () => {
    expect(AxesUtil.createXAxis.bind(AxesUtil)).not.toThrow();
  });

  it('will not fail for undefined axis config', () => {
    const result = AxesUtil.createYAxis({
      scale: 'time',
      autoTicks: true
    }, scaleLinear());
    expect((typeof result) === 'function').toEqual(true);
    expect((typeof result.scale) === 'function').toEqual(true);
  });

});
