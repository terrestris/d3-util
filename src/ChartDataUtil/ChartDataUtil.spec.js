/*eslint-env jest*/

import ChartDataUtil from './ChartDataUtil.js';

describe('ChartDataUtil', () => {

  it('is defined', () => {
    expect(ChartDataUtil).not.toBeUndefined();
  });

  it('can convert point data to line data', () => {
    const data = [[1, 2], [2, 7], [3, 99], undefined, [5, 17], [6, 1], undefined, [8, 9]];
    const converted = ChartDataUtil.lineDataFromPointData(data);
    expect(converted).toEqual([[[1, 2], [2, 7], [3, 99]], [[5, 17], [6, 1]]]);
  });

  it('does not forget the last line', () => {
    const data = [[1, 2], [2, 7], [3, 99]];
    const converted = ChartDataUtil.lineDataFromPointData(data);
    expect(converted).toEqual([[[1, 2], [2, 7], [3, 99]]]);
  });

  it('ignores the last undefined value', () => {
    const data = [[1, 2], [2, 7], [3, 99], undefined];
    const converted = ChartDataUtil.lineDataFromPointData(data);
    expect(converted).toEqual([[[1, 2], [2, 7], [3, 99]]]);
  });

});
