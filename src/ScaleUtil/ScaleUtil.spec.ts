/*eslint-env jest*/

import ScaleUtil from './ScaleUtil';
import { scaleLinear } from 'd3-scale';
import { AxisConfiguration } from '../AxesUtil/AxesUtil';

describe('ScaleUtil', () => {

  it('is defined', () => {
    expect(ScaleUtil).not.toBeUndefined();
  });

  it('can set the domain for scales', () => {
    const scale = scaleLinear();
    ScaleUtil.setDomainForScale({} as AxisConfiguration, scale, [1, 1, 2, 3], false);
    expect(scale.domain()).toEqual([1, 3]);
  });

  it('can create scales', () => {
    const scales = ScaleUtil.createScales({
      series: [{
        data: [[1, 1], [2, 3]],
        axes: ['x', 'y']
      }],
      axes: {
        x: {
          scale: 'linear',
          orientation: 'x',
          min: 0,
          max: 10
        },
        y: {
          scale: 'log',
          orientation: 'y'
        }
      }
    });
    expect(scales.XSCALE).not.toEqual(undefined);
    expect(scales.x).not.toEqual(undefined);
    expect(scales.y).not.toEqual(undefined);
    expect(scales.XSCALE.domain()).toEqual([0, 10]);
  });

  it('can create bar chart scales', () => {
    const scales = ScaleUtil.createBarScales({
      data: {
        data: [],
        grouped: ['one', 'two']
      },
      axes: {
        x: {
          scale: 'band',
          orientation: 'x'
        },
        y: {
          scale: 'log',
          orientation: 'y'
        },
        groupx: {
          scale: 'log',
          orientation: 'y'
        }
      },
      size: [100, 100],
      groupedInitiallyHidden: [] as string[],
      groupsInitiallyHidden: [] as string[]
    });
    expect(scales.length).toEqual(3);
  });

  it('will harmonize log scales', () => {
    const scales = ScaleUtil.createScales({
      series: [{
        data: [[1, 1], [2, 30]],
        axes: ['x', 'y']
      }],
      axes: {
        x: {
          scale: 'time',
          orientation: 'x',
          min: 0,
          max: 10
        },
        y: {
          scale: 'log',
          orientation: 'y',
          harmonize: true
        }
      }
    });
    expect(scales.y.domain()).toEqual([100, 1]);
  });

  it('can create bar chart time/linear scales', () => {
    const scales = ScaleUtil.createBarScales({
      data: {
        data: [],
        grouped: ['one', 'two']
      },
      axes: {
        x: {
          scale: 'band',
          orientation: 'x'
        },
        y: {
          scale: 'linear',
          orientation: 'y'
        },
        groupx: {
          scale: 'time',
          orientation: 'y'
        }
      },
      size: [100, 100],
      groupedInitiallyHidden: [] as string[],
      groupsInitiallyHidden: [] as string[]
      });
    expect(scales.length).toEqual(3);
  });

});
