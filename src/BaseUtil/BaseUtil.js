/**
 * Class with helper functions to create/manage chart axes.
 */
class BaseUtil {

  /**
   * Adds common parts like title and background color.
   */
  static addCommonParts(root, offset, config, size) {
    if (config.backgroundColor) {
      root.insert('rect', ':first-child')
        .attr('class', 'timeseries-background')
        .attr('x', offset)
        .attr('y', 0)
        .attr('width', config.size[0] - offset)
        .attr('height', config.size[1])
        .style('fill', config.backgroundColor);
    }
    if (config.title) {
      root.append('text')
        .attr('x', size[0] / 2)
        .attr('y', parseInt(config.titlePadding) + parseInt(config.titleSize || 20))
        .attr('class', 'timeseries-title')
        .style('text-anchor', 'middle')
        .style('font-size', config.titleSize || 20)
        .style('fill', config.titleColor)
        .text(config.title);
    }
  }

}

export default BaseUtil;
