import extent from 'd3-array/src/extent';
import scaleLinear from 'd3-scale/src/linear';
import scaleTime from 'd3-scale/src/time';

/**
 * Helper functions to create d3 scales.
 */
class ScaleUtil {

  /**
   * Recalculates min/max values from data and axis configuration.
   * @param {object} axis the axis configuration, with scale, min and max
   *  properties set
   * @param {d3.scale} scale the d3 scale object
   * @param {any[]} data the data to analyze
   * @param {boolean} reverse whether to invert the data (y-axis)
   */
  static setDomainForScale(axis, scale, data, reverse) {
    let axisDomain;
    let makeDomainNice = true;
    let min;
    let max;

    if (axis.min !== undefined) {
      min = axis.min;
      makeDomainNice = false;
    }
    if (axis.max !== undefined) {
      max = axis.max;
      makeDomainNice = false;
    }

    if (min !== undefined && max !== undefined) {
      // We're basically done for this axis, both min and max were
      // given. We need to iterate over the data nonetheless, so as to
      // extend the minimim and maximum in case of outliers.
      axisDomain = [min, max];
    }

    const ext = extent(data);

    if (!axisDomain) {
      axisDomain = [ext[0], ext[1]];
    } else {
      // will override min/max settings in case the data is larger/smaller
      axisDomain[0] = Math.min(ext[0], axisDomain[0]);
      axisDomain[1] = Math.max(ext[1], axisDomain[1]);
    }

    if (axis.scale === 'log' && (axisDomain[0] === 0 || axisDomain[1] === 0 ||
      isNaN(axisDomain[0]) || isNaN(axisDomain[1]))) {
      if (axisDomain[0] === 0 || isNaN(axisDomain[0])) {
        axisDomain[0] = Number.MIN_VALUE;
      }
      if (axisDomain[1] === 0 || isNaN(axisDomain[1])) {
        axisDomain[1] = Number.MIN_VALUE;
      }
    }

    if (reverse) {
      axisDomain.reverse();
    }

    // actually set the domain
    var domain = scale.domain(axisDomain);
    if (makeDomainNice) {
      domain.nice();
    }
  }

  /**
   * Create the scales for a timeseries configuration.
   * @param  {Object} config a timeseries component configuration
   * @return {Object} a map mapping axis keys to scales. The special key XSCALE
   * maps to the x scale (only one really makes sense in a timeseries)
   */
  static createScales(config) {
    const scaleData = {};
    config.series.forEach(line => {
      line.axes.forEach(axis => {
        if (!scaleData[axis]) {
          scaleData[axis] = [];
        }
        scaleData[axis] = scaleData[axis].concat(line.data.map(d => {
          return config.axes[axis].orientation === 'x' ? d[0] : d[1];
        }));
      });
    });
    let xscale;
    const scales = {};
    Object.entries(scaleData).map(([axis, data]) => {
      let scale;
      switch (config.axes[axis].scale) {
        case 'linear': scale = scaleLinear();
          break;
        case 'time': scale = scaleTime();
      }
      if (config.axes[axis].orientation === 'x') {
        xscale = scale;
      }
      ScaleUtil.setDomainForScale(config.axes[axis], scale, data.filter(d => d),
        config.axes[axis].orientation === 'y');
      scales[axis] = scale;
    });
    scales.XSCALE = xscale;
    return scales;
  }

}

export default ScaleUtil;
