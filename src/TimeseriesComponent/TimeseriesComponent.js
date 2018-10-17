import ChartDataUtil from '../ChartDataUtil/ChartDataUtil';
import ScaleUtil from '../ScaleUtil/ScaleUtil';
import AxesUtil from '../AxesUtil/AxesUtil';
import BaseUtil from '../BaseUtil/BaseUtil';
import LabelUtil from '../LabelUtil/LabelUtil';
import zoom from 'd3-zoom/src/zoom';
import {identity} from 'd3-zoom/src/transform';
import {event} from 'd3-selection/src/selection/on';
import select from 'd3-selection/src/select';
import d3line from 'd3-shape/src/line.js';
import d3tip from 'd3-tip';
import d3color from 'd3-color/src/color';
import linear from 'd3-shape/src/curve/linear';
import step from 'd3-shape/src/curve/step';
import {stepBefore} from 'd3-shape/src/curve/step';
import {stepAfter} from 'd3-shape/src/curve/step';
import basis from 'd3-shape/src/curve/basis';
import natural from 'd3-shape/src/curve/natural';
import {monotoneX} from 'd3-shape/src/curve/monotone';

/**
 * A component that can be used in the chart renderer to render a timeseries
 * chart.
 */
class TimeseriesComponent {

  static counter = 0;

  config = {
    series: [],
    zoomEnabled: true,
    backgroundColor: null,
    startDate: null,
    endDate: null,
    size: [100, 100],
    chartMargin: {
      top: null,
      right: null,
      bottom: null,
      left: null
    }
  }

  /**
   * Constructs a new timeseries component with a given configuration.
   * @param {object} config a configuration object
   */
  constructor(config) {
    this.config = config;
    this.fillDefaults(config);
    this.originalScales = ScaleUtil.createScales(this.config);
  }

  /**
   * Fills in missing default values into the configuration.
   * @param  {object} config the object to fill the defaults in
   */
  fillDefaults(config) {
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
  renderDots(g, line, idx, x, y) {
    /** Empty fn. */
    let over = () => undefined;
    /** Empty fn. */
    let out = () => undefined;

    if (line.showTooltip) {
      const tip = d3tip().attr('class', 'd3-tip').html(d => d[1]);
      g.call(tip);
      over = tip.show;
      out = tip.hide;
    }
    if (line.useTooltipFunc) {
      over = (d, idx, dots) => {
        d[2](dots[idx]);
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
  renderCircles(g, idx, line, x, y, over, out) {
    g.selectAll(`circle.series-${idx}`)
      .data(line.data)
      .enter()
      .filter(d => {
        if (d && d[3] && d[3].type && d[3].type !== 'circle') {
          return false;
        }
        return d;
      })
      .append('circle')
      .attr('class', `series-${idx}`)
      .attr('cx', d => x(d[0]))
      .attr('cy', d => y(d[1]))
      .attr('r', '5px')
      .attr('fill', line.color)
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
  renderStars(g, idx, line, x, y, over, out) {
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
        let val = x(d[0]);
        if (d[3] && d[3].radius) {
          val -= d[3].radius;
        } else {
          val -= 10;
        }
        return val;
      })
      .attr('y', d => {
        let val = y(d[1]);
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
      .attr('points', function(d) {
        // inspired by http://svgdiscovery.com/C02/create-svg-star-polygon.htm
        var radius = 10;
        var sides = 5;
        if (d[3] && d[3].radius) {
          var r = d[3].radius;
          if (r) {
            radius = parseInt(r);
          }
        }
        if (d[3] && d[3].sides) {
          var s = d[3].sides;
          if (s) {
            sides = parseInt(s);
          }
        }
        var theta = Math.PI * 2 / sides;
        var x = radius;
        var y = radius;
        var star = '';
        for (var i = 0; i < sides; i++) {
          var k = i + 1;
          var sineAngle = Math.sin(theta * k);
          var cosineAngle = Math.cos(theta * k);
          var x1 = radius / 2 * sineAngle + x;
          var y1 = radius / 2 * cosineAngle + y;
          var sineAngleAlpha = Math.sin(theta * k + 0.5 * theta);
          var cosineAngleAlpha = Math.cos(theta * k + 0.5 * theta);
          var x2 = radius * sineAngleAlpha + x;
          var y2 = radius * cosineAngleAlpha + y;
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
  renderRects(g, idx, line, x, y, over, out) {
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
        return d3color(color).darker();
      })
      .style('stroke-width', 2)
      .on('mouseover', over)
      .on('mouseout', out)
      .attr('x', d => {
        let val = x(d[0]);
        if (d[3] && d[3].width) {
          val -= d[3].width / 2;
        } else {
          val -= 5;
        }
        return val;
      })
      .attr('y', d => {
        let val = y(d[1]);
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
  renderLine(g, line, idx, x, y) {
    const lineData = ChartDataUtil.lineDataFromPointData(line.data);
    let curve;
    switch (line.curveType) {
      case 'linear': curve = linear;
        break;
      case 'cubicBasisSpline': curve = basis;
        break;
      case 'curveMonotoneX': curve = monotoneX;
        break;
      case 'naturalCubicSpline': curve = natural;
        break;
      case 'curveStep': curve = step;
        break;
      case 'curveStepBefore': curve = stepBefore;
        break;
      case 'curveStepAfter': curve = stepAfter;
        break;
    }
    lineData.forEach(data => {
      const generator = d3line()
        .curve(curve)
        .x(d => x(d[0]))
        .y(d => y(d[1]));
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
  calculateAxesWidth(node) {
    const axisElems = node.selectAll('.y-axes').nodes();
    return axisElems.reduce((acc, node) => acc + node.getBBox().width, 0);
  }

  /**
   * Creates an d3 axis from the given scale.
   * @param  {d3.scale} y the y scale
   * @param  {object} series the series configuration
   * @param  {selection} selection the d3 selection to append the axes to
   * @param  {number[]} size the chart size
   */
  drawYAxis(y, series, selection, size) {
    const config = this.config.axes[series.axes[1]];
    if (!config.display) {
      return;
    }
    const yAxis = AxesUtil.createYAxis(config, y);

    let width = this.calculateAxesWidth(select(selection.node().parentNode));
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
      AxesUtil.sanitizeAxisLabels(axis, config.scale === 'log');
    }
    if (config.label) {
      axis.append('text')
        .attr('transform', `rotate(-90)`)
        .attr('x', -size[1] / 2)
        .attr('y', config.labelSize || 13)
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
  drawYGridAxis(y, config, selection, size) {
    if (!config.display || !config.showGrid) {
      return;
    }
    let width = this.calculateAxesWidth(select(selection.node().parentNode));
    const gridAxis = AxesUtil.createYAxis(config, y);
    gridAxis
      .tickFormat('')
      .tickSize(size[0] - width);
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
  drawXAxis(x, selection, size, width) {
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
      LabelUtil.handleLabelWrap(axis);
    }

    if (config.showGrid) {
      const gridAxis = AxesUtil.createXAxis(config, x);
      gridAxis
        .tickFormat('')
        .tickSize(-size[1]);
      selection.insert('g', ':first-child')
        .attr('transform', `translate(${width}, ${size[1]})`)
        .attr('class', 'x-axis')
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
  enableZoom(root, zoomType) {
    this.zoomType = zoomType;
    if (zoomType === 'none') {
      return;
    }

    this.zoomBehaviour = zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], this.svgSize])
      .on('zoom', () => {
        const transform = event.transform;
        this.mainScaleX = transform.rescaleX(this.originalScales.XSCALE);
        this.yScales = {};
        Object.entries(this.originalScales)
          .filter(entry => this.config.axes[entry[0]] && this.config.axes[entry[0]].orientation === 'y')
          .forEach(([key, scale]) => this.yScales[key] = transform.rescaleY(scale));
        if (zoomType === 'transform') {
          root.selectAll('.x-axis').remove();
          root.selectAll('.y-axis').remove();
          root.selectAll('.timeseries-chart')
            .attr('transform', transform);
        }
        this.render(root, this.config.size, true);
      });

    root.call(this.zoomBehaviour);
  }

  /**
   * Append a clipping rect. this.clipId will contain the clipPath's id.
   * @param  {d3.selection} root svg node to append the clip rect to
   * @param  {Number} x where to start clipping
   * @param  {Number} y where to start clipping
   * @param  {Number} width where to end clipping
   * @param  {Number} height where to end clipping
   */
  appendClipRect(root, x, y, width, height) {
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
   * Render the timeseries to the given root node.
   * @param  {d3.selection} root the root node
   * @param  {number[]} size the size of the svg
   * @param  {boolean} rerender if true, rerendering mode is enabled
   */
  render(root, size, rerender) {
    if (!this.config.series || this.config.series.length === 0) {
      // refuse to render chart without series
      return;
    }
    this.rootNode = root;

    let g = root.selectAll('g.timeseries');
    let chartRoot = g.selectAll('g.timeseries-chart');
    if (g.node() && rerender && this.zoomType !== 'transform') {
      g.remove();
      root.selectAll(`#${this.clipId}`).remove();
    }
    root.selectAll('.y-axes,.y-grid-axes').remove();
    const needRecreate = !g.node() || this.zoomType === 'rerender';
    if (needRecreate) {
      g = root.append('g').attr('class', `timeseries ${this.config.extraClasses ? this.config.extraClasses : ''}`);
      const clip = g.append('g').attr('class', 'timeseries-clip');
      chartRoot = clip.append('g').attr('class', 'timeseries-chart');
    }
    g.attr('transform', `translate(${this.config.position[0]}, ${this.config.position[1]})`);

    const yScales = this.prepareYAxes(rerender, g);
    const width = this.calculateAxesWidth(g);
    const x = rerender ? this.mainScaleX : this.originalScales.XSCALE.range([0, this.config.size[0] - width]);
    if (needRecreate) {
      this.appendClipRect(root, width, 0, this.config.size[0] - width, this.config.size[1]);
      root.select('.timeseries-clip')
        .attr('clip-path', `url(#${this.clipId})`);
    }

    this.drawXAxis(x, g, this.config.size, width);
    this.renderSeries(rerender, chartRoot, x, yScales, width);

    this.yScales = yScales;
    this.mainScaleX = x;
    this.xOffset = width;
    this.svgSize = size;

    BaseUtil.addBackground(g, width, this.config);
    if (needRecreate) {
      root.select('.timeseries-title').remove();
      BaseUtil.addTitle(root, this.config, size);
    }
  }

  /**
   * Actually render the series (dots and lines).
   * @param {Boolean} rerender if rerender mode is enabled
   * @param {d3.selection} g the node to render to
   * @param {d3.scale} x the x scale
   * @param {d3.scale[]} yScales the y scales
   * @param {Number} width the x offset
   */
  renderSeries(rerender, g, x, yScales, width) {
    this.config.series.forEach((line, idx) => {
      if (rerender && this.zoomType === 'transform') {
        return;
      }
      const y = yScales[line.axes[1]];
      const dotsg = g.append('g')
        .attr('class', `series-${idx}`)
        .attr('transform', `translate(${width}, 0)`);
      const lineg = g.append('g')
        .attr('class', `series-${idx}`)
        .attr('transform', `translate(${width}, 0)`);
      if (!line.skipDots) {
        this.renderDots(dotsg, line, idx, x, y);
      }
      if (!line.skipLine) {
        this.renderLine(lineg, line, idx, x, y);
      }
    });
  }

  /**
   * Prepares and renders y axis/scales.
   * @param {Boolean} rerender whether we are in rerender mode
   * @param {d3.selection} node the node to render the axes to
   * @return {Function[]} the y scales in order of the series
   */
  prepareYAxes(rerender, node) {
    const yScales = {};
    const yAxesDrawn = [];
    let g = node.insert('g', ':first-child').attr('class', 'y-axes');
    this.config.series.forEach(line => {
      let y = this.originalScales[line.axes[1]];
      y.range([0, this.config.size[1]]);
      if (rerender) {
        y = this.yScales[line.axes[1]];
      }
      yScales[line.axes[1]] = y;
      if (this.config.axes[line.axes[1]].display &&
        !yAxesDrawn.includes(line.axes[1])) {
        this.drawYAxis(y, line, g, this.config.size);
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
  toggleSeries(index) {
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
  visible(index) {
    const nodes = this.rootNode.selectAll(`g.series-${index}`);
    const visible = nodes.attr('visible');
    return visible !== 'false';
  }

  /**
   * Reset the zoom.
   */
  resetZoom() {
    this.zoomBehaviour.transform(this.rootNode, identity);
  }

}

export default TimeseriesComponent;
