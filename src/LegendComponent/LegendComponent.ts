import LabelUtil from '../LabelUtil/LabelUtil';
import { event } from 'd3-selection';
import { ChartComponent } from '../ChartRenderer/ChartRenderer';
import { NodeSelection } from '../BaseUtil/BaseUtil';

const SVG_DEFS: any = {
  LEGEND_ICON_BACKGROUND: 'M-3 -14 h 25 v 16 h -25 Z',
  LEGEND_ICON_AREA: 'M0 -6 C 3 0, 7 0, 10 -6 S 15 -12, 20 -6 M20 -6 v 6 h -20 v -6 Z',
  LEGEND_ICON_BAR: 'M0 -10 h 6 v 12 h -6 Z M7 -6 h 6 v 8 h -6 Z M14 -10 h 6 v 12 h -6 Z',
  LEGEND_ICON_LINE: 'M0 -6 C 3 0, 7 0, 10 -6 S 15 -12, 20 -6'
};

interface LegendItemConfiguration {
  type?: string;
  style?: object;
  title?: string;
  tooltip?: string;
  value?: string;
  contextmenuHandler?: (event: any) => any;
  onClick?: (event: any) => any;
  customRenderer?: (legend: NodeSelection) => any;
  onHover?: (event: any) => any;
  onMouseOut?: (event: any) => any;
}

interface LegendConfiguration {
  items: LegendItemConfiguration[];
  extraClasses?: string;
  position: [number, number];
  legendEntryMaxLength?: number;
}

/**
 * A component that can be used in the chart renderer to render a legend.
 */
class LegendComponent implements ChartComponent {

  config: LegendConfiguration;

  legendNode: NodeSelection;

  /**
   * Constructs a new legend component.
   * @param {Object} config the legend configuration
   */
  constructor(config: LegendConfiguration) {
    this.config = config;
    if (config.position &&
      (!Number.isFinite(config.position[0]) || !Number.isFinite(config.position[1]))
    ) {
      throw 'Invalid position config passed to TimeSeriesComponent: ' + config.position;
    }
    // just ignore legend items w/o type
    config.items = config.items.filter(item => item.type);
  }

  /**
   * Apply the style properties.
   * @param  {Object} style the style properties
   * @param  {d3.selection} node the node to apply the properties to
   */
  applyStyle(style: object, node: NodeSelection) {
    Object.entries(style).forEach(([prop, value]) => {
      node.style(prop, value);
    });
  }

  /**
   * Construct a legend element.
   * @param {Object} item legend item config
   * @param {Number} idx item index
   * @param {d3.selection} g the legend container
   * @param {Number} extraHeight extra height to consider
   */
  constructLegendElement(
    item: LegendItemConfiguration,
    idx: number,
    g: NodeSelection,
    extraHeight: number
  ) {
    const leg = g.append('g')
      .attr('transform', `translate(0, ${(idx + 1) * 20 + extraHeight})`);
    const path = leg.append('path')
      .attr('d', () => {
        const typeUppercase = item.type.toUpperCase();
        return SVG_DEFS['LEGEND_ICON_' + typeUppercase];
      })
      .style('stroke', 'none')
      .style('fill', 'none');
    this.applyStyle(item.style, path);

    leg.append('path')
      .attr('d', SVG_DEFS.LEGEND_ICON_BACKGROUND)
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
      .text(item.tooltip || item.title);
    if (item.value) {
      leg.attr('value', item.value);
    }

    if (item.customRenderer instanceof Function) {
      item.customRenderer(leg);
    }
    if (item.onClick) {
      leg.style('cursor', 'pointer');
      leg.on('click', () => item.onClick(event));
    }
    if (item.onHover) {
      leg.on('mouseover', () => item.onHover(event));
    }
    if (item.onMouseOut) {
      leg.on('mouseleave', () => item.onMouseOut(event));
    }
    if (item.contextmenuHandler) {
      // looks like there's no longtouch event? new Ext.Element won't
      // help either (svg not supported?)
      let timer: number;
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
    // subtract 25 for the legend icon width
    const length = this.config.legendEntryMaxLength - 25;
    leg.selectAll('g > text.legend-title').call(LabelUtil.wordWrap, length, 25, 1.2);
    const count = leg.selectAll('tspan').size();
    return 14 * (count - 1);
  }

  /**
   * Render the legend.
   * @param  {d3.selection} root the root node
   */
  render(root: NodeSelection) {
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
