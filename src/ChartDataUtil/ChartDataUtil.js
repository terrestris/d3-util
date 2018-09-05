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
    let line = [];
    data.forEach(d => {
      if (d !== undefined && last !== undefined) {
        line.push(last);
      } else {
        if (line.length > 1) {
          lineData.push(line);
        }
        line = [];
      }
      last = d;
    });
    if (line.length > 1) {
      lineData.push(line);
    }
    return lineData;
  }

}

export default ChartDataUtil;
