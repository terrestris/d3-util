import ChartDataUtil from '../ChartDataUtil/ChartDataUtil';
import ScaleUtil, { Scale, Scales } from '../ScaleUtil/ScaleUtil';
import AxesUtil, { AxisConfiguration } from '../AxesUtil/AxesUtil';
import BaseUtil, { NodeSelection, BackgroundConfiguration, TitleConfiguration } from '../BaseUtil/BaseUtil';
import LabelUtil from '../LabelUtil/LabelUtil';
import { zoomIdentity, zoom, zoomTransform as transform, ZoomBehavior, ZoomTransform, ZoomScale } from 'd3-zoom';
import { select, event, ValueFn } from 'd3-selection';
import { tip as d3tip } from 'd3';
import { color as d3color } from 'd3-color';
import {
  curveStepBefore as stepBefore,
  curveStepAfter as stepAfter,
  curveLinear as linear,
  curveStep as step,
  curveBasis as basis,
  curveNatural as natural,
  curveMonotoneX as monotoneX,
  line as d3line
} from 'd3-shape';
import { ChartComponent, ZoomType } from 'src/ChartRenderer/ChartRenderer';

export type TimeseriesDatum = [number, number, Function?, any?];

export interface Timeseries {
  color?: string;
  showTooltip?: boolean;
  useTooltipFunc?: boolean;
  data: TimeseriesDatum[];
  axes: string[];
  curveType?: string;
  style?: any;
  initiallyVisible?: boolean;
  skipLine?: boolean;
  skipDots?: boolean;
}

export interface TimeseriesConfiguration extends BackgroundConfiguration, TitleConfiguration {
  size?: [number, number];
  position?: [number, number];
  series: Timeseries[];
  axes: {
    [name: string]: AxisConfiguration;
  };
  initialZoom?: ZoomTransform;
  extraClasses?: string;
}

export interface YScales {
  [name: string]: Scale;
}

/**
 * A component that can be used in the chart renderer to render a timeseries
 * chart.
 */
class TimeseriesComponent implements ChartComponent {

  config: TimeseriesConfiguration;
  originalScales: Scales;
  zoomType: ZoomType;
  zoomBehaviour: ZoomBehavior<Element, {}>;
  xOffset: number;
  preventYAxisZoom: boolean;
  preventXAxisZoom: boolean;
  static counter: number = 0;
  rootNode: NodeSelection;
  yScales: YScales;
  mainScaleX: Scale;
  svgSize: [number, number];
  clipId: string;

  /**
   * Constructs a new timeseries component with a given configuration.
   * @param {object} config a configuration object
   */
  constructor(config: TimeseriesConfiguration) {
    this.config = config;
    if (config.size &&
      (!Number.isFinite(config.size[0]) || !Number.isFinite(config.size[1]))
    ) {
      throw 'Invalid size config passed to TimeSeriesComponent: ' + config.size;
    }
    this.fillDefaults(config);
    this.originalScales = ScaleUtil.createScales(this.config);
  }

  /**
   * Fills in missing default values into the configuration.
   * @param  {object} config the object to fill the defaults in
   */
  fillDefaults(config: TimeseriesConfiguration) {
    config.series.forEach(line => {
      if (!line.color) {
        line.color = '#';
        [0, 1, 2, 3, 4, 5].forEach(() => line.color += '0123456789ABCDEF'[Math.floor(Math.random() * 16)]);
      }
    });
  }

  /**
   * Render the dots of the timeseries.
   * @param  {d3.selection} g the g node to render the dots into
   * @param  {object} line the series configuration
   * @param  {number} idx the series index
   * @param  {d3.scale} x the x scale
   * @param  {d3.scale} y the y scale
   */
  renderDots(g: NodeSelection, line: Timeseries, idx: number, x: Scale, y: Scale) {
    /** Empty fn. */
    let over = (...args: any): any => undefined;
    /** Empty fn. */
    let out = (): any => undefined;

    if (line.showTooltip) {
      const tip = d3tip().attr('class', 'd3-tip').html((d: any[]) => d[1]);
      g.call(tip as unknown as (args: any) => NodeSelection);
      over = tip.show;
      out = tip.hide;
    }
    if (line.useTooltipFunc) {
      over = (d: any[], index: number, dots: any) => {
        d[2](dots[index]);
      };
    }

    this.renderCircles(g, idx, line, x, y, over, out);
    this.renderRects(g, idx, line, x, y, over, out);
    this.renderStars(g, idx, line, x, y, over, out);
  }

  /**
   * Render circle type dots.
   * @param  {d3.selection} g to render the circles to
   * @param  {Number} idx index of the series
   * @param  {Object} line the series config
   * @param  {d3.scale} x x scale
   * @param  {d3.scale} y y scale
   * @param  {Function} over the mouseover callback
   * @param  {Function} out the mouseout callback
   */
  renderCircles(
    g: NodeSelection,
    idx: number,
    line: Timeseries,
    x: Scale,
    y: Scale,
    over: ValueFn<SVGElement, any[], void>,
    out: ValueFn<SVGElement, any[], void>
  ) {
    g.selectAll(`circle.series-${idx}`)
      .data(line.data)
      .enter()
      .filter(d => {
        if (d && d[3] && d[3].type && d[3].type !== 'circle') {
          return false;
        }
        return d !== undefined;
      })
      .append('circle')
      .attr('class', `series-${idx}`)
      .attr('cx', d => x(d[0] as any))
      .attr('cy', d => y(d[1] as any))
      .attr('r', d => d[3] ? d[3].radius || 5 : 5)
      .attr('fill', line.color)
      .style('fill', d => d[3] ? d[3].fill : undefined)
      .style('stroke', d => d[3] ? d[3].stroke : undefined)
      .on('mouseover', over)
      .on('mouseout', out);
  }

  /**
   * Render rectangle type dots.
   * @param  {d3.selection} g to render the rects to
   * @param  {Number} idx index of the series
   * @param  {Object} line the series config
   * @param  {d3.scale} x x scale
   * @param  {d3.scale} y y scale
   * @param  {Function} over the mouseover callback
   * @param  {Function} out the mouseout callback
   */
  renderStars(
    g: NodeSelection,
    idx: number,
    line: Timeseries,
    x: Scale,
    y: Scale,
    over: ValueFn<SVGElement, any[], void>,
    out: ValueFn<SVGElement, any[], void>
  ) {
    g.selectAll('polygon')
      .data(line.data)
      .enter()
      .filter(d => {
        if (d && d[3] && d[3].type && d[3].type !== 'star') {
          return false;
        }
        if (d && d[3] && d[3].type === 'star') {
          return true;
        }
        return false;
      })
      .append('svg')
      .attr('x', d => {
        let val = x(d[0] as any);
        if (d[3] && d[3].radius) {
          val -= d[3].radius;
        } else {
          val -= 10;
        }
        return val;
      })
      .attr('y', d => {
        let val = y(d[1] as any);
        if (d[3] && d[3].radius) {
          val -= d[3].radius;
        } else {
          val -= 10;
        }
        return val;
      })
      .attr('width', d => {
        let val = 20;
        if (d[3] && d[3].radius) {
          val = d[3].radius * 2;
        }
        return val;
      })
      .attr('height', d => {
        let val = 20;
        if (d[3] && d[3].radius) {
          val = d[3].radius * 2;
        }
        return val;
      })
      .append('polygon')
      .style('fill', d => {
        let color;
        if (d && d[3] && d[3].fill) {
          color = d[3].fill;
        } else {
          color = line.color;
        }
        return color;
      })
      .style('stroke', d => {
        let color;
        if (d && d[3] && d[3].stroke) {
          color = d[3].stroke;
        } else {
          color = d3color(line.color).darker();
        }
        return color;
      })
      .style('stroke-width', 1)
      .on('mouseover', over)
      .on('mouseout', out)
      .attr('points', function (d: any[]) {
        // inspired by http://svgdiscovery.com/C02/create-svg-star-polygon.htm
        let radius = 10;
        let sides = 5;
        if (d[3] && d[3].radius) {
          const r = d[3].radius;
          if (r) {
            radius = parseInt(r, 10);
          }
        }
        if (d[3] && d[3].sides) {
          const s = d[3].sides;
          if (s) {
            sides = parseInt(s, 10);
          }
        }
        const theta = Math.PI * 2 / sides;
        const x0: number = radius;
        const y0: number = radius;
        let star = '';
        for (let i = 0; i < sides; i++) {
          const k = i + 1;
          const sineAngle = Math.sin(theta * k);
          const cosineAngle = Math.cos(theta * k);
          const x1 = radius / 2 * sineAngle + x0;
          const y1 = radius / 2 * cosineAngle + y0;
          const sineAngleAlpha = Math.sin(theta * k + 0.5 * theta);
          const cosineAngleAlpha = Math.cos(theta * k + 0.5 * theta);
          const x2 = radius * sineAngleAlpha + x0;
          const y2 = radius * cosineAngleAlpha + y0;
          star += x1 + ',' + y1 + ' ';
          star += x2 + ',' + y2 + ' ';
        }
        return star;
      });
  }

  /**
   * Render rectangle type dots.
   * @param  {d3.selection} g to render the rects to
   * @param  {Number} idx index of the series
   * @param  {Object} line the series config
   * @param  {d3.scale} x x scale
   * @param  {d3.scale} y y scale
   * @param  {Function} over the mouseover callback
   * @param  {Function} out the mouseout callback
   */
  renderRects(
    g: NodeSelection,
    idx: number,
    line: Timeseries,
    x: Scale,
    y: Scale,
    over: ValueFn<SVGElement, any[], void>,
    out: ValueFn<SVGElement, any[], void>
  ) {
    g.selectAll('rect')
      .data(line.data)
      .enter()
      .filter(d => {
        if (d && d[3] && d[3].type && d[3].type !== 'rect') {
          return false;
        }
        if (d && d[3] && d[3].type === 'rect') {
          return true;
        }
        return false;
      })
      .append('rect')
      .style('fill', d => {
        if (d[3] && d[3].fill) {
          return d[3].fill;
        }
        return line.color;
      })
      .style('stroke', d => {
        let color;
        if (d[3] && d[3].fill) {
          color = d[3].fill;
        }
        color = line.color;
        return d3color(color).darker().toString();
      })
      .style('stroke-width', 2)
      .on('mouseover', over)
      .on('mouseout', out)
      .attr('x', d => {
        let val = x(d[0] as any);
        if (d[3] && d[3].width) {
          val -= d[3].width / 2;
        } else {
          val -= 5;
        }
        return val;
      })
      .attr('y', d => {
        let val = y(d[1] as any);
        if (d[3] && d[3].height) {
          val -= d[3].height / 2;
        } else {
          val -= 5;
        }
        return val;
      })
      .attr('width', d => {
        if (d[3] && d[3].width) {
          return d[3].width;
        }
        return 10;
      })
      .attr('height', d => {
        if (d[3] && d[3].height) {
          return d[3].height;
        }
        return 10;
      });
  }

  /**
   * Connect the dots with a line.
   * @param  {d3.selection} g the g node to render the line into
   * @param  {object} line the series configuration
   * @param  {number} idx the series index
   * @param  {d3.scale} x the x scale
   * @param  {d3.scale} y the y scale
   */
  renderLine(
    g: NodeSelection,
    line: Timeseries,
    idx: number,
    x: Scale,
    y: Scale
  ) {
    const lineData = ChartDataUtil.lineDataFromPointData(line.data);
    let curve: any;
    switch (line.curveType) {
      case undefined:
      case 'linear':
        curve = linear;
        break;
      case 'cubicBasisSpline':
        curve = basis;
        break;
      case 'curveMonotoneX':
        curve = monotoneX;
        break;
      case 'naturalCubicSpline':
        curve = natural;
        break;
      case 'curveStep':
        curve = step;
        break;
      case 'curveStepBefore':
        curve = stepBefore;
        break;
      case 'curveStepAfter':
        curve = stepAfter;
        break;
      default:
    }
    lineData.forEach(data => {
      const generator = d3line()
        .curve(curve)
        .x((d: TimeseriesDatum) => x(d[0] as any))
        .y((d: TimeseriesDatum) => y(d[1] as any));
      const width = line.style ? line.style['stroke-width'] : 1;
      const dash = line.style ? line.style['stroke-dasharray'] : undefined;
      const color = (line.style && line.style.stroke) ? line.style.stroke : line.color;

      g.append('path')
        .datum(data)
        .attr('d', generator)
        .attr('class', `series-${idx}`)
        .style('fill', 'none')
        .style('stroke-width', width)
        .style('stroke-dasharray', dash)
        .style('stroke', color);
    });
  }

  /**
   * Calculate the width of all currently visible axes.
   * @param {d3.selection} node a node below which the axes are rendered
   * @return {Number} the width of all axes
   */
  calculateAxesWidth(node: NodeSelection) {
    const axisElems = node.selectAll('.y-axes').nodes();
    return axisElems.reduce((acc, cur: SVGElement) => acc + cur.getBoundingClientRect().width, 0);
  }

  /**
   * Creates an d3 axis from the given scale.
   * @param  {d3.scale} y the y scale
   * @param  {object} series the series configuration
   * @param  {selection} selection the d3 selection to append the axes to
   */
  drawYAxis(y: Scale, series: Timeseries, selection: NodeSelection) {
    const config = this.config.axes[series.axes[1]];
    if (!config.display) {
      return;
    }
    const yAxis = AxesUtil.createYAxis(config, y);

    let width = this.calculateAxesWidth(select(selection.node().parentNode) as NodeSelection);
    let pad = config.labelSize || 13;
    if (config.labelPadding) {
      pad += config.labelPadding;
    }

    const axis = selection.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${width}, 0)`);
    axis.append('g')
      .attr('transform', `translate(${pad}, 0)`)
      .call(yAxis);
    if (config.sanitizeLabels) {
      AxesUtil.sanitizeAxisLabels(axis);
    }
    const axisHeight = axis.node().getBoundingClientRect().height;
    const axisWidth = axis.node().getBoundingClientRect().width;
    axis.attr('transform', `translate(${width + axisWidth}, 0)`);
    if (config.label) {
      axis.append('text')
        .attr('transform', `rotate(-90)`)
        .attr('x', -axisHeight / 2)
        .attr('y', (config.labelSize || 13) - axisWidth)
        .style('text-anchor', 'middle')
        .style('font-size', config.labelSize || 13)
        .style('fill', config.labelColor)
        .text(config.label);
    }
  }

  /**
   * Draws a y grid axis.
   * @param {d3.scale} y the y scale
   * @param {Object} config the axis configuration
   * @param {d3.selection} selection to append the grid to
   * @param {Number[]} size the chart size
   */
  drawYGridAxis(
    y: Scale,
    config: AxisConfiguration,
    selection: NodeSelection,
    size: [number, number]
  ) {
    if (!config.display || !config.showGrid) {
      return;
    }
    let width = this.calculateAxesWidth(select(selection.node().parentNode) as NodeSelection);
    const gridAxis = AxesUtil.createYAxis(config, y);
    gridAxis
      .tickFormat('' as null)
      .tickSize(-(size[0] - width));
    selection.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .attr('class', 'y-axis')
      .style('stroke-width', config.gridWidth || 1)
      .style('color', config.gridColor || '#d3d3d3')
      .style('stroke', config.gridColor || '#d3d3d3')
      .style('stroke-opacity', config.gridOpacity || 0.7)
      .call(gridAxis);
  }

  /**
   * Creates the x axis for a chart.
   * @param  {d3.scale} x the d3 scale
   * @param  {d3.selection} selection the d3 selection to add the axis to
   * @param  {number[]} size the remaining chart size
   * @param  {number} width the x offset to draw the chart at
   */
  drawXAxis(
    x: Scale,
    selection: NodeSelection,
    size: [number, number],
    width: number
  ) {
    const config = Object.values(this.config.axes).find(item => item.orientation === 'x');
    const xAxis = AxesUtil.createXAxis(config, x);

    const axis = selection.insert('g', ':first-child')
      .attr('transform', `translate(${width}, ${size[1]})`)
      .attr('class', 'x-axis')
      .call(xAxis);

    if (config.labelRotation) {
      axis.selectAll('text')
        .attr('transform', `rotate(${config.labelRotation})`)
        .attr('dx', '-10px')
        .attr('dy', '1px')
        .style('text-anchor', 'end');
    } else {
      LabelUtil.handleLabelWrap(axis as NodeSelection);
    }

    if (config.showGrid) {
      const gridAxis = AxesUtil.createXAxis(config, x);
      gridAxis
        .tickFormat('' as null)
        .tickSize(-size[1]);
      selection.insert('g', ':first-child')
        .attr('transform', `translate(${width}, ${size[1]})`)
        .attr('class', 'x-grid-axis')
        .style('stroke-width', config.gridWidth || 1)
        .style('color', config.gridColor || '#d3d3d3')
        .style('stroke', config.gridColor || '#d3d3d3')
        .style('stroke-opacity', config.gridOpacity || 0.7)
        .call(gridAxis);
    }
  }

  /**
   * Enables zoom on the chart.
   * @param {d3.selection} root the node for which to enable zoom
   * @param {String} zoomType the zoom type
   */
  enableZoom(root: NodeSelection, zoomType: ZoomType) {
    this.zoomType = zoomType;
    if (zoomType === 'none') {
      return;
    }

    this.zoomBehaviour = zoom()
      .extent([[0, 0], [this.config.size[0] - this.xOffset, this.config.size[1]]])
      .translateExtent([[0, 0], [this.config.size[0] - this.xOffset, this.config.size[1]]])
      .scaleExtent([1, Infinity])
      .on('zoom', () => {
        const eventTransform = event.transform;
        if (!this.preventXAxisZoom) {
          this.mainScaleX = eventTransform.rescaleX(this.originalScales.XSCALE);
        }

        if (!this.preventYAxisZoom) {
          this.yScales = {};
          Object.entries(this.originalScales)
            .filter(entry => this.config.axes[entry[0]] && this.config.axes[entry[0]].orientation === 'y')
            .forEach(([key, scale]) => this.yScales[key] = eventTransform.rescaleY(scale));
        }

        if (zoomType === 'transform') {
          root.selectAll('.x-axis').remove();
          root.selectAll('.y-axis').remove();
          root.selectAll('.timeseries-chart')
            .attr('transform', eventTransform);
        }
        this.render(root, this.svgSize, true);
      });

    const zoomSelection = root.select('.timeseries-chart');
    zoomSelection.call(this.zoomBehaviour);
    if (this.config.initialZoom) {
      this.yScales = {};
      const trans = zoomIdentity
        .translate(this.config.initialZoom.x, this.config.initialZoom.y)
        .scale(this.config.initialZoom.k);
      Object.entries(this.originalScales)
        .filter(entry => this.config.axes[entry[0]] && this.config.axes[entry[0]].orientation === 'y')
        // the typing magic is unfortunately required
        .forEach(([key, scale]) => this.yScales[key] = trans.rescaleY(scale as unknown as ZoomScale) as Scale);
      this.zoomBehaviour.transform(zoomSelection as NodeSelection, trans);
    }
  }

  /**
   * Append a clipping rect. this.clipId will contain the clipPath's id.
   * @param  {d3.selection} root svg node to append the clip rect to
   * @param  {Number} x where to start clipping
   * @param  {Number} y where to start clipping
   * @param  {Number} width where to end clipping
   * @param  {Number} height where to end clipping
   */
  appendClipRect(root: NodeSelection, x: number, y: number, width: number, height: number) {
    this.clipId = `clip-path-${++TimeseriesComponent.counter}`;
    root.select('defs').remove();
    root.append('defs')
      .append('clipPath')
      .attr('id', this.clipId)
      .append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height);
  }

  /**
   * Determine the space the axes need by prerendering and removing them.
   * @param {boolean} rerender whether in rerender mode (probably doesn't matter here)
   * @param {d3.selection} g the node to render the axes to
   */
  determineAxesSpace(rerender: boolean, g: NodeSelection) {
    const x = rerender ? this.mainScaleX : this.originalScales.XSCALE.range([0, this.config.size[0]]);
    this.prepareYAxes(rerender, g, [0, this.config.size[1]]);
    const width = this.calculateAxesWidth(g);
    this.drawXAxis(x as Scale, g, this.config.size, this.config.size[1]);
    const xAxisNode = g.select('.x-axis');
    const height = (xAxisNode.node() as Element).getBoundingClientRect().height;
    xAxisNode.remove();
    g.selectAll('.x-grid-axis,.y-axes,.y-grid-axes').remove();
    return [width, height];
  }

  /**
   * Render the timeseries to the given root node.
   * @param  {d3.selection} root the root node
   * @param  {number[]} size the size of the svg
   * @param  {boolean} rerender if true, rerendering mode is enabled
   */
  render(root: NodeSelection, size: [number, number], rerender?: boolean) {
    if (!this.config.series || this.config.series.length === 0) {
      // refuse to render chart without series
      return;
    }
    this.rootNode = root;
    if (this.config.backgroundColor) {
      root.style('background-color', this.config.backgroundColor);
    }

    let g = root.selectAll('g.timeseries');
    let chartRoot = g.selectAll('.timeseries-chart');
    let visibleState = {};
    if (g.node() && rerender && this.zoomType !== 'transform') {
      // save visibility state for later
      root.selectAll('.timeseries-data,.timeseries-line').each(function() {
        const node = this as HTMLElement;
        if (node.hasAttribute('visible')) {
          visibleState[node.getAttribute('class')] = node.getAttribute('visible');
        }
      });
      root.selectAll(`#${this.clipId}`).remove();
    }
    root.selectAll('.y-axes,.y-grid-axes').remove();
    const needRecreate = !g.node() || this.zoomType === 'rerender';
    if (needRecreate) {
      if (!g.node()) {
        g = root.append('g').attr('class', `timeseries ${this.config.extraClasses ? this.config.extraClasses : ''}`);
        const clip = g.append('g').attr('class', 'timeseries-clip');
        chartRoot = clip.append('g').attr('class', 'timeseries-chart');
      } else {
        g.selectAll('.timeseries-data,.x-axis,.x-grid-axis,.timeseries-line').remove();
      }
    }
    const offsets = this.determineAxesSpace(rerender, g as NodeSelection);
    g.attr('transform', `translate(${this.config.position[0]}, ${this.config.position[1]})`);

    const yScales = this.prepareYAxes(rerender, g as NodeSelection, [0, this.config.size[1] - offsets[1]]);
    const width = this.calculateAxesWidth(g as NodeSelection);
    const x = rerender ? this.mainScaleX : this.originalScales.XSCALE.range([0, this.config.size[0] - width]);

    if (needRecreate) {
      this.appendClipRect(root, width, 0, this.config.size[0] - width, this.config.size[1] - offsets[1]);
      root.select('.timeseries-clip')
        .attr('clip-path', `url(#${this.clipId})`);
    }

    this.drawXAxis(x as Scale, g as NodeSelection, [this.config.size[0], this.config.size[1] - offsets[1]], width);
    g.select('.x-axis').attr('transform', `translate(${width}, ${this.config.size[1] - offsets[1]})`);

    // IMPORTANT: need to put the transform on the element upon which the zoom
    // behaviour works, else centering the zoom on the mouse position will be
    // next to impossible
    chartRoot.attr('transform', `translate(${width}, 0)`);
    this.renderSeries(rerender, chartRoot as NodeSelection, x as Scale, yScales as Scale[]);

    this.yScales = yScales;
    this.mainScaleX = x as Scale;
    this.xOffset = width;
    this.svgSize = size;

    BaseUtil.addBackground(
      chartRoot as NodeSelection,
      width,
      this.config,
      [this.config.size[0], this.config.size[1] - offsets[1]]
    );
    root.select('.timeseries-title').remove();
    BaseUtil.addTitle(root, this.config, width);

    // restore visibility state of hidden items
    Object.keys(visibleState).forEach(cls => {
      const visible = visibleState[cls];
      if (visible === 'false') {
        root.select(`.${cls}`.replace(' ', '.'))
          .attr('visible', 'false')
          .style('display', 'none');
      }
    });
  }

  /**
   * Actually render the series (dots and lines).
   * @param {Boolean} rerender if rerender mode is enabled
   * @param {d3.selection} g the node to render to
   * @param {d3.scale} x the x scale
   * @param {d3.scale[]} yScales the y scales
   */
  renderSeries(rerender: boolean, g: NodeSelection, x: Scale, yScales: Scale[]) {
    this.config.series.forEach((line, idx) => {
      if (rerender && this.zoomType === 'transform') {
        return;
      }
      const y = yScales[line.axes[1]];
      const dotsg = g.append('g')
        .attr('class', `series-${idx} timeseries-data`);
      const lineg = g.append('g')
        .attr('class', `series-${idx} timeseries-line`);
      if (!line.skipDots) {
        this.renderDots(dotsg, line, idx, x, y);
      }
      if (!line.skipLine) {
        this.renderLine(lineg, line, idx, x, y);
      }
      if (line.initiallyVisible === false) {
        dotsg.style('display', 'none')
          .attr('visible', false);
        lineg.style('display', 'none')
          .attr('visible', false);
      }
    });
  }

  /**
   * Prepares and renders y axis/scales.
   * @param {Boolean} rerender whether we are in rerender mode
   * @param {d3.selection} node the node to render the axes to
   * @param {number[]} yRange the y scale range
   * @return {Function[]} the y scales in order of the series
   */
  prepareYAxes(rerender: boolean, node: NodeSelection, yRange: [number, number]) {
    const yScales = {};
    const yAxesDrawn: string[] = [];
    let g = node.insert('g', ':first-child').attr('class', 'y-axes');
    this.config.series.forEach(line => {
      // sanitize y values if a log scale is used
      if (this.config.axes[line.axes[1]].scale === 'log') {
        line.data = line.data
          .filter(d => d)
          .map(d => [d[0], d[1] === 0 ? ScaleUtil.EPSILON : d[1], d[2], d[3]] as TimeseriesDatum);
      }
      let y = this.originalScales[line.axes[1]];
      if (rerender) {
        y = this.yScales[line.axes[1]];
      }
      y.range(yRange);
      yScales[line.axes[1]] = y;
      if (this.config.axes[line.axes[1]].display &&
        !yAxesDrawn.includes(line.axes[1]) && line.initiallyVisible !== false) {
        this.drawYAxis(y, line, g);
        yAxesDrawn.push(line.axes[1]);
      }
    });
    g = node.insert('g', ':first-child').attr('class', 'y-grid-axes');
    Object.entries(this.config.axes).forEach(([key, config]) => {
      if (config.orientation === 'y') {
        this.drawYGridAxis(yScales[key], config, g, this.config.size);
      }
    });
    return yScales;
  }

  /**
   * Toggle the visibility of a series.
   * @param  {Number} index index of the series to toggle
   */
  toggleSeries(index: number) {
    const nodes = this.rootNode.selectAll(`g.series-${index}`);
    const visible = nodes.attr('visible');
    if (visible === 'false') {
      nodes.attr('visible', true);
      nodes.style('display', 'block');
    } else {
      nodes.attr('visible', false);
      nodes.style('display', 'none');
    }
  }

  /**
   * Return whether a series is currently visible.
   * @param  {Number} index the index of the series
   * @return {Boolean} whether the series is visible
   */
  visible(index: number) {
    const nodes = this.rootNode.selectAll(`g.series-${index}`);
    const visible = nodes.attr('visible');
    return visible !== 'false';
  }

  /**
   * Reset the zoom.
   */
  resetZoom() {
    (this.rootNode.select('.timeseries-chart') as NodeSelection)
      .transition().duration(750).call(this.zoomBehaviour.transform, zoomIdentity);
  }

  /**
   * Returns the current zoom transformation.
   * @return {d3.transform} the current transform
   */
  getCurrentZoom() {
    return transform((this.rootNode.select('.timeseries-chart') as NodeSelection).node());
  }

  /**
   * Set whether y axis zoom is enabled.
   * @param {boolean} enable if true, y axis zoom will be possible
   */
  enableYAxisZoom(enable: boolean) {
    this.preventYAxisZoom = !enable;
  }

  /**
   * Set whether x axis zoom is enabled.
   * @param {boolean} enable if true, x axis zoom will be possible
   */
  enableXAxisZoom(enable: boolean) {
    this.preventXAxisZoom = !enable;
  }

}

export default TimeseriesComponent;
