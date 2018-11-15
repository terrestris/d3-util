/*eslint-env jest*/

import ScaleUtil from './ScaleUtil.js';
import scaleLinear from 'd3-scale/src/linear';

describe('ScaleUtil', () => {

  it('is defined', () => {
    expect(ScaleUtil).not.toBeUndefined();
  });

  it('can set the domain for scales', () => {
    const scale = scaleLinear();
    ScaleUtil.setDomainForScale({}, scale, [1, 1, 2, 3]);
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
        }
      },
      size: [100, 100]
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
        y2: {
          scale: 'time',
          orientation: 'y'
        }
      },
      size: [100, 100]
    });
    expect(scales.length).toEqual(3);
  });

});
