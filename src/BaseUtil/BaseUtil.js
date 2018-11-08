/**
 * Class with helper functions to create/manage chart axes.
 */
class BaseUtil {

  /**
   * Adds background color.
   * @param {d3.selection} root to render the background rect to
   * @param {Number} offset the x offset to use
   * @param {Object} config the chart config object
   * @param {Number[]} size the resulting chart size w/o axes
   */
  static addBackground(root, offset, config, size) {
    const color = config.backgroundColor ? config.backgroundColor : 'black';
    root.select('.timeseries-background').remove();
    root.insert('rect', ':first-child')
      .attr('class', 'timeseries-background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', size[0] - offset)
      .attr('height', size[1])
      .style('opacity', config.backgroundColor ? 1 : 0)
      .style('fill', color);
  }

  /**
   * Adds a title.
   * @param {d3.selection} root the node to render the title on
   * @param {Object} config the chart config object
   * @param {Number} xOffset the x offset to add
   */
  static addTitle(root, config, xOffset) {
    if (config.title) {
      root.append('text')
        .attr('x', config.size[0] / 2 + xOffset)
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
