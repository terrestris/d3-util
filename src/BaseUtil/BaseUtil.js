/**
 * Class with helper functions to create/manage chart axes.
 */
class BaseUtil {

  /**
   * Adds background color.
   * @param {d3.selection} root to render the background rect to
   * @param {Number} offset the x offset to use
   * @param {Object} config the chart config object
   */
  static addBackground(root, offset, config) {
    if (config.backgroundColor) {
      root.select('.timeseries-background').remove();
      root.insert('rect', ':first-child')
        .attr('class', 'timeseries-background')
        .attr('x', offset)
        .attr('y', 0)
        .attr('width', config.size[0] - offset)
        .attr('height', config.size[1])
        .style('fill', config.backgroundColor);
    }
  }

  /**
   * Adds a title.
   * @param {d3.selection} root the node to render the title on
   * @param {Object} config the chart config object
   * @param {Number[]} size the size of the chart
   */
  static addTitle(root, config, size) {
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
