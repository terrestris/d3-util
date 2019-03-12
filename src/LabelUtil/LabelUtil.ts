import { Selection, select } from 'd3-selection';
import { NodeSelection } from 'src/BaseUtil/BaseUtil';

/**
 * Utilities to word wrap labels automatically.
 */
class LabelUtil {

  /**
   * Determines if labels can be wrapped
   *
   * @param  {d3.selection} root the root node to search for text from
   * @param  {String} subSelector The subSelector for single text elements
   * @param  {Integer} leftPadding The amount of padding to the left,
   *     beginning from the second line. Needed for legends with images
   * @param  {Integer} lineHeight The lineHeight in em to use
   * @param {Boolean} ignoreNeighbors Flag indicating if neighbors should
   *     be respected. Should be false e.g. when used on an x-axis.
   * @param {Integer} distanceBuffer The buffer used for spacing between labels
   */
  static handleLabelWrap(
    root: NodeSelection,
    subSelector?: string,
    leftPadding?: number,
    lineHeight?: number,
    ignoreNeighbors?: boolean,
    distanceBuffer?: number
  ) {
    const node = root.node();
    if (!node) {
      return;
    }
    const width = node.getBoundingClientRect().width;
    let length;
    if (ignoreNeighbors) {
      length = width - distanceBuffer - (leftPadding || 0);
    } else {
      const neighborCount = root.selectAll(subSelector || ' g > text').size();
      length = width / neighborCount - distanceBuffer - (leftPadding || 0);
    }
    root.selectAll(subSelector || ' g > text')
      .call(this.wordWrap, length, leftPadding, lineHeight);
  }

  /**
   * Handles word wrapping.
   *
   * @param  {Object} textEl The text element collection
   * @param  {Integer} width The maximum width to use
   * @param  {Integer} leftPadding The amount of padding to the left
   * @param  {Integer} lineHeight The lineHeight in em to use
   */
  static wordWrap(
    textEl: Selection<HTMLElement, {}, undefined, undefined>,
    width: number,
    leftPadding: number,
    lineHeight: number
  ) {
    textEl.each(function(this: HTMLElement) {
      const text = select(this);
      const words = text.text().split(/\s+/).reverse();
      let word;
      let line: string[] = [];
      const lh = lineHeight || 0.2;
      // ems
      const dy = parseFloat(text.attr('dy'));

      let tspan = text.text(null)
        .append('tspan')
        .attr('x', 0)
        .attr('dy', dy + 'em');
      word = words.pop();
      let i = 0;
      while (word) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getBoundingClientRect().width > width) {
          // keep the first line if it already does not fit,
          // else replace current content
          if (i !== 0) {
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            tspan = text.append('tspan')
              .attr('x', i > 0 ? leftPadding || 0 : 0)
              .attr('dy', lh + dy + 'em')
              .text(word);
          }
        }
        word = words.pop();
        i++;
      }
    });
  }

}

export default LabelUtil;
