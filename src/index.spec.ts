/*eslint-env jest*/

import {
  ChartDataUtil,
  ChartRenderer,
  ScaleUtil,
  TimeseriesComponent,
  BarComponent,
  LegendComponent
} from './index';

describe('TimeseriesComponent', () => {

  it('is defined', () => {
    expect(ChartDataUtil).not.toBeUndefined();
    expect(ChartRenderer).not.toBeUndefined();
    expect(ScaleUtil).not.toBeUndefined();
    expect(TimeseriesComponent).not.toBeUndefined();
    expect(BarComponent).not.toBeUndefined();
    expect(LegendComponent).not.toBeUndefined();
  });

});
