import extent from 'd3-array/src/extent';

/**
 * Helper functions to create d3 scales.
 */
class ScaleUtil {

  /**
   * Recalculates min/max values from data and axis configuration.
   * @param {object} axis the axis configuration, with scale, min and max
   *  properties set
   * @param {[type]} scale  [description]
   * @param {[type]} orient [description]
   * @param {[type]} config [description]
   */
  static setDomainForScale(axis, scale, data) {
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

    // actually set the domain
    var domain = scale.domain(axisDomain);
    if (makeDomainNice) {
      domain.nice();
    }
  }

}

export default ScaleUtil;
