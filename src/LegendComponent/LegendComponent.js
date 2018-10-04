import LabelUtil from '../LabelUtil/LabelUtil';
import {event} from 'd3-selection/src/selection/on';

/**
 * A component that can be used in the chart renderer to render a legend.
 */
class LegendComponent {

  SVG_DEFS = {
    LEGEND_ICON_BACKGROUND: 'M-3 -14 h 25 v 16 h -25 Z',
    LEGEND_ICON_AREA: 'M0 -6 C 3 0, 7 0, 10 -6 S 15 -12, 20 -6 M20 -6 v 6 h -20 v -6 Z',
    LEGEND_ICON_BAR: 'M0 -10 h 6 v 12 h -6 Z M7 -6 h 6 v 8 h -6 Z M14 -10 h 6 v 12 h -6 Z',
    LEGEND_ICON_LINE: 'M0 -6 C 3 0, 7 0, 10 -6 S 15 -12, 20 -6'
  }

  /**
   * Constructs a new legend component.
   * @param {Object} config the legend configuration
   */
  constructor(config) {
    this.config = config;
    // just ignore legend items w/o type
    config.items = config.items.filter(item => item.type);
  }

  /**
   * Apply the style properties.
   * @param  {Object} style the style properties
   * @param  {d3.selection} node the node to apply the properties to
   */
  applyStyle(style, node) {
    Object.entries(style).forEach(([prop, value]) => {
      node.style(prop, value);
    });
  }

  constructLegendElement = (item, idx, g, extraHeight) => {
    const leg = g.append('g')
      .attr('transform', `translate(0, ${(idx + 1) * 20 + extraHeight})`);
    const path = leg.append('path')
      .attr('d', () => {
        const typeUppercase = item.type.toUpperCase();
        return this.SVG_DEFS['LEGEND_ICON_' + typeUppercase];
      })
      .style('stroke', 'none')
      .style('fill', 'none');
    this.applyStyle(item.style, path);

    leg.append('path')
      .attr('d', this.SVG_DEFS.LEGEND_ICON_BACKGROUND)
      .style('stroke', 'none')
      // invisible, but still triggering events
      .style('fill', 'rgba(0,0,0,0)');
    leg.append('text')
      .attr('class', 'legend-title')
      .text(item.title)
      .attr('text-anchor', 'start')
      .attr('dy', '0')
      .attr('dx', '25');

    leg.append('title')
      .text(item.title);

    if (item.customRenderer instanceof Function) {
      item.customRenderer(leg);
    }
    if (item.onClick) {
      leg.style('cursor', 'pointer');
      leg.on('click', () => {
        item.onClick(event);
      });
    }
    if (item.contextmenuHandler) {
      // looks like there's no longtouch event? new Ext.Element won't
      // help either (svg not supported?)
      var timer;
      leg.on('touchstart', function() {
        timer = window.setTimeout(() => item.contextmenuHandler(event), 500);
      });
      leg.on('touchend', function() {
        if (timer) {
          window.clearTimeout(timer);
        }
      });
      leg.on('contextmenu', () => item.contextmenuHandler(event));
    }
    if (!this.config.legendEntryMaxLength) {
      return 0;
    }
    LabelUtil.handleLabelWrap(leg, ' g > text.legend-title', 25, 1.2, true, this.config.legendEntryMaxLength);
    const count = leg.selectAll('tspan').size();
    return 14 * (count - 1);
  }

  /**
   * Render the legend.
   * @param  {d3.selection} root the root node
   * @param  {number[]} size the size of the svg
   */
  render(root) {
    const g = root.append('g')
      .attr('class', `legend ${this.config.extraClasses ? this.config.extraClasses : ''}`)
      .attr('transform', `translate(${this.config.position[0]}, ${this.config.position[1]})`);

    let extraHeight = 0;
    this.config.items.forEach((item, idx) => {
      extraHeight += this.constructLegendElement(item, idx, g, extraHeight);
    });
    this.legendNode = g;
  }

}

export default LegendComponent;
