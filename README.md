# d3-util

A set of helper classes for working with d3 charts.

## Installation

```javascript static
npm i @terrestris/d3-util
```

## Usage

### General notes

The `ChartRenderer` is the main entry point to render a chart. It features a
`render` method that can be used to render its components to a given DOM node.

The chart renderer can be constructed with a few parameters:

* `components`: a list of chart components constituting the chart
* `size`: the desired chart size in pixels
* `zoomType`: the desired zoom type. `'none'` for no zoom, `'transform'` for a
zoom using the svg `transform` attribute without rebuilding the DOM or
`'rerender'` for a zoom rebuilding the DOM. Using the transform method has the
effect of also zooming the shapes, i.e. a line of 1px will get bigger when
zooming in.

### Components

#### LegendComponent

The legend component simply renders a list of legend elements. It accepts the
following configuration parameters:

* `extraClasses`: a string with extra CSS classes to add to the legend group
* `legendEntryMaxLength`: a number with the max number of characters per line
for legend labels
* `position`: an array `[x, y]` with the desired position within the svg
* `items`: an array of legend element configurations

The legend items can have the following configuration parameters:

* `contextmenuHandler`: can be a function that is called in case the user
right clicks or long touches the item. Argument is the `d3.event` event
* `customRenderer`: can be a function that is called during rendering and will
be called with the item's group element. Can be used to e.g. render custom
buttons for the legend element
* `onClick`: can be a function getting the current `d3.event` once an item is
clicked
* `style`: can be an object with svg style parameters such as `stroke`,
`stroke-width` etc. in order to style the legend icon
* `title`: the legend text
* `type`: can be `'line'`, `'bar'`, `'area'` or `'background'` in order to
render a line, a small bar chart icon, a line with the area below it filled or
just a filled block

#### BarComponent

The bar component can render (grouped) bar charts. It accepts the following
configuration parameters:

* `axes`: an axis configuration object (see below)
* `backgroundColor`: can be a hex color string
* `extraClasses`: a string with extra CSS classes to set on the bar chart node
* `position`: the `[x, y]` coordinates
* `rotateBarLabel`: if true, the labels will be rotated by 90°
* `size`: the `[width, height]` size
* `title`: if set, a heading will be rendered with this text
* `titleColor`: the color hex string
* `titlePadding`: title padding from the top
* `titleSize`: title size
* `data`: the data object. Example:

```
{
  data: [{
    value: 'Value 1',
    values: [{
      index: 'Group 1',
      value: 23,
      uncertainty: undefined,
      color: '#ff0000',
      belowThreshold: false,
      label: '23',
      tooltipFunc: target => 'Tooltip'
    }, {
      index: 'Group 3',
      value: 42,
      uncertainty: 5.6,
      color: '#00ff00',
      belowThreshold: true,
      label: '<'
    }]
  }],
  grouped: ['Group 1', 'Group 2', 'Group 3']
}
```

The `grouped` field contains a list of the grouped indexes, the data list
contains the actual groups. A group object contains a `value` with the group
name/label and a list of `values` corresponding to the actual bars.

The bar objects can have a number of configuration values:

* `index`: corresponds to one of the value in the `grouped` list (not all
grouped values must be contained in every group)
* `value`: the actual y value
* `uncertainty`: if set to a value, an uncertainty indicator will be rendered
on top of the bar
* `color`: the hex color value
* `belowThreshold`: if true, no bar will be drawn, just the label
* `label`: if set, a label will be rendered onto the bar
* `tooltipFunc`: if set, the function will be called with the bar element upon
mouseover

#### TimeseriesComponent

The timeseries component can render multiple line charts. It supports the
following configuration parameters:

* `axes`: an axis configuration object (see below)
* `backgroundColor`: as color hex string
* `extraClasses`: extra classes to set on the timeseries chart node
* `position`: the `[x, y]` coordinates
* `size`: the `[width, height]` size
* `title`: if set, a heading will be rendered with this text
* `titleColor`: the color hex string
* `titlePadding`: title padding from the top
* `titleSize`: title size
* `series`: a list of line chart configurations as follows

A line chart configuration has the following options:

* `axes`: a list of axis ids referencing x and y axis configurations like
`['x', 'y0']`
* `color`: the color hex string
* `curveType`: a d3 curve type string like `curveStepBefore`
* `shapeType`: usually `'line'`, can also be `'area'`
* `useTooltipFunc`: a boolean indicating whether the third data value is a
tooltip function
* `data`: an array with the data: `[xvalue, yvalue, tooltipFunc, styleObject]`

The tooltip function is optional as well as the style. If the style is set, it
is used to configure the corresponding point symbol. Examples for style objects
would be:

```
      {
          "type": "circle",
          "radius": "5"
      }
      {
          "type": "circle",
          "radius": "10"
      }
      {
          "type": "star",
          "sides": 5,
          "radius": 10
      }
      {
          "type": "rect",
          "width": 15,
          "height": 20
      }
```

#### Axis configuration objects

The axis configuration objects configure the scales and axes of a chart. You'll
need to configure at least an `x` and a `y` axis, but at least for line charts
multiple y axes are allowed (you still must use the same x axis for all lines).

The object maps axis ids (with `x` and `y` mandatory) to axis configurations,
which may have the following options:

* `display`: boolean that determines whether the axis is drawn or not
* `format`: a d3 format string like `",.2f"`
* `label`: an optional axis label
* `labelColor`: the label color hex string
* `labelPadding`: label padding
* `labelRotation`: label rotation
* `labelSize`: label size
* `max`: the axis and scale max value (optional)
* `min`: the axis and scale min value (optional)
* `orientation`: the axis orientation (x or y)
* `sanitizeLabels`: if set to true, overlapping tick labels will be removed
(only supported for y axes)
* `scale`: the scale to use (linear, log, time)
* `tickPadding`: the tick padding
* `tickSize`: the tick size

A note on line charts: you can have multiple y axes here. Using the line chart
axis references you can have some lines correspond to one y axis and some lines
correspond to another y axis. As noted above, you still need to use the same x
axis for all lines (else the chart would supposedly be confusing anyway).

## Development

If you want to contribute, you can build the project like this:

* `git checkout https://github.com/terrestris/d3-util`
* `cd d3-util`
* `npm i`

and then either

* `npm run build:dev`

in order to get a development build or

* `npm run build:dist`

in order to get a production build.
