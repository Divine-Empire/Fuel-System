import tallyMock from '../mock/tally.json';
import { salesService } from './sales.service';

export const compareService = {
  getTallyData: () => {
    return tallyMock;
  },

  reconcile: () => {
    const sales = salesService.getSales();
    const tally = compareService.getTallyData();

    const tallyMap = new Map(tally.map(t => [t.invoiceNo, t]));
    const salesMap = new Map(sales.map(s => [s.invoiceNo, s]));

    const results = [];

    // Check all sales records
    sales.forEach(sale => {
      const tallyRecord = tallyMap.get(sale.invoiceNo);
      if (!tallyRecord) {
        results.push({
          invoiceNo: sale.invoiceNo,
          customerName: sale.customerName,
          salesAmount: sale.totalAmount,
          tallyAmount: null,
          status: 'missing_in_tally'
        });
      } else if (sale.totalAmount === tallyRecord.totalAmount) {
        results.push({
          invoiceNo: sale.invoiceNo,
          customerName: sale.customerName,
          salesAmount: sale.totalAmount,
          tallyAmount: tallyRecord.totalAmount,
          status: 'matched'
        });
      } else {
        results.push({
          invoiceNo: sale.invoiceNo,
          customerName: sale.customerName,
          salesAmount: sale.totalAmount,
          tallyAmount: tallyRecord.totalAmount,
          status: 'unmatched'
        });
      }
    });

    // Check tally records that are missing in sales
    tally.forEach(t => {
      if (!salesMap.has(t.invoiceNo)) {
        results.push({
          invoiceNo: t.invoiceNo,
          customerName: t.customerName,
          salesAmount: null,
          tallyAmount: t.totalAmount,
          status: 'missing_in_sales'
        });
      }
    });

    return results;
  }
};
