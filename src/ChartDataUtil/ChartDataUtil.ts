/**
 * Helper functions to create suitable chart data.
 */
class ChartDataUtil {

  /**
   * Converts point data to line data by creating pairs of x/y
   * coordinates
   * @param  {number[][]} data the points
   * @return {number[][][]} the line data
   */
  static lineDataFromPointData(data: number[][]): number[][][] {
    const lineData = [];
    let last: number[];
    let line: number[][] = [];
    data.forEach(d => {
      if (last !== undefined) {
        line.push(last);
      } else {
        if (line.length > 1) {
          lineData.push(line);
        }
        line = [];
      }
      last = d;
    });

    if (last) {
      line.push(last);
    }

    if (line.length > 1) {
      lineData.push(line);
    }
    return lineData;
  }

}

export default ChartDataUtil;
