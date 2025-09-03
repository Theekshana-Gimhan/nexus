import express from 'express';
import axios from 'axios';
import { mapInvoiceFromQBO } from '../services/mapping';

const router = express.Router();

// Simple auth for connector (service account token)
router.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || token !== process.env.NEXUS_SERVICE_ACCOUNT_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Pull invoices from QuickBooks (mock or real)
router.get('/pull/invoices', async (req, res) => {
  if (process.env.MOCK_MODE === 'true') {
    const mockInvoices = [
      { Id: '1001', TotalAmt: 1200.5, CustomerRef: {value: 'C1', name: 'Acme Corp'}, TxnDate: '2025-09-01' }
    ];
    const mapped = mockInvoices.map(mapInvoiceFromQBO);
    // Post into Nexus via Gateway (example)
    try {
      await axios.post(`${process.env.NEXUS_GATEWAY_URL}/api/v1/invoices/bulk`, { invoices: mapped }, {
        headers: { Authorization: `Bearer ${process.env.NEXUS_SERVICE_ACCOUNT_TOKEN}` }
      });
    } catch (err: unknown) {
      // Log but continue
      const msg = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
      console.warn('Failed to push invoices to Nexus', msg);
    }
    return res.json({ success: true, count: mapped.length, data: mapped });
  }

  // Real QuickBooks API call placeholder
  res.status(501).json({ error: 'Not implemented - configure QBO API calls' });
});

export default router;
