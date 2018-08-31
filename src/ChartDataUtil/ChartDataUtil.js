/**
 * Helper functions to create suitable chart data.
 */
class ChartDataUtil {

  /**
   * Converts point data to line data by creating pairs of x/y
   * coordinates
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  static lineDataFromPointData(data) {
    const lineData = [];
    let last;
    data.forEach(d => {
      if (d !== undefined && last !== undefined) {
        lineData.push([last[0], last[1], d[0], d[1]]);
      } else {
        lineData.push(undefined);
      }
      last = d;
    });
    return lineData;
  }

}

export default ChartDataUtil;
