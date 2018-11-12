import extent from 'd3-array/src/extent';
import scaleLinear from 'd3-scale/src/linear';
import scaleTime from 'd3-scale/src/time';
import scaleLog from 'd3-scale/src/log';
import scaleBand from 'd3-scale/src/band';

/**
 * Helper functions to create d3 scales.
 */
class ScaleUtil {

  static EPSILON = 0.000001;

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

    if (axis.harmonize) {
      axisDomain[0] = Math.pow(10, Math.floor(Math.log(axisDomain[0]) / Math.log(10)));
      axisDomain[1] = Math.pow(10, Math.ceil(Math.log(axisDomain[1]) / Math.log(10)));
    }
    if (axis.scale === 'log' && (axisDomain[0] === 0 || axisDomain[1] === 0 ||
      isNaN(axisDomain[0]) || isNaN(axisDomain[1]))) {
      if (axisDomain[0] === 0 || isNaN(axisDomain[0])) {
        axisDomain[0] = ScaleUtil.EPSILON;
      }
      if (axisDomain[1] === 0 || isNaN(axisDomain[1])) {
        axisDomain[1] = ScaleUtil.EPSILON;
      }
    }

    // always have at least a minimal domain interval
    if (axisDomain[0] === axisDomain[1]) {
      axisDomain[1] += 0.01;
    }
    if (axis.factor) {
      axisDomain[1] = axisDomain[1] / axis.factor;
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
        scaleData[axis] = scaleData[axis].concat(line.data
          .filter(d => d !== undefined)
          .map(d => {
            return config.axes[axis].orientation === 'x' ? d[0] : d[1];
          }));
      });
    });
    let xscale;
    const scales = {};
    Object.entries(scaleData).map(([axis, data]) => {
      const cfg = config.axes[axis];
      let scale;
      switch (cfg.scale) {
        case 'linear': scale = scaleLinear();
          break;
        case 'time': scale = scaleTime();
          break;
        case 'log': scale = scaleLog();
      }
      if (cfg.orientation === 'x') {
        xscale = scale;
      }
      ScaleUtil.setDomainForScale(cfg, scale, data.filter(d => d !== undefined),
        cfg.orientation === 'y');
      scales[axis] = scale;
    });
    scales.XSCALE = xscale;
    return scales;
  }

  /**
   * Create scales for a grouped bar chart, that is:
   * * two x axes (one for the top level groups, one for the grouped values)
   * * one y axis
   * @param  {Object} config a bar chart configuration
   * @return {d3.scale[]} the x and y scales
   */
  static createBarScales(config) {
    const xData = config.data.data.map(group => group.value);
    const yData = config.data.data.reduce((acc, val) => acc.concat(val.values), [])
      .map(val => val.value)
      .filter(d => d !== undefined);
    let xscale;
    let yscale;
    Object.values(config.axes).forEach(axis => {
      let scale;
      switch (axis.scale) {
        case 'linear': scale = scaleLinear();
          break;
        case 'time': scale = scaleTime();
          break;
        case 'log': scale = scaleLog();
          break;
        case 'band': scale = scaleBand();
      }
      if (axis.orientation === 'x') {
        xscale = scale;
        xscale.domain(xData);
      }
      if (axis.orientation === 'y') {
        yscale = scale;
        ScaleUtil.setDomainForScale(axis, scale, yData, true);
      }
    });
    xscale.range([0, config.size[0]]);
    yscale.range([0, config.size[1]]);
    const groupedx = scaleBand().padding(0.1);
    groupedx.domain(config.data.grouped).rangeRound([0, xscale.bandwidth()]);
    return [xscale, groupedx, yscale];
  }

}

export default ScaleUtil;
