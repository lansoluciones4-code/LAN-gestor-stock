'use server';

import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { sales, products, productLosses } from '@/lib/db/schema';
import { gte, lte, and } from 'drizzle-orm';

export async function fetchDashboardStats(startDate?: string, endDate?: string) {
  try {
    await verifyAuthOrAdmin(false);

    const start = startDate ? new Date(startDate + 'T00:00:00') : new Date(0);
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();

    // Use transaction for cross-query consistency (snapshot isolation)
    const result = await db.transaction(async (tx) => {
      // 1. Fetch data in parallel
      const [allProducts, salesWithItems, lossesWithProducts] = await Promise.all([
        tx.select().from(products),
        tx.query.sales.findMany({
          where: and(gte(sales.createdAt, start), lte(sales.createdAt, end)),
          with: {
            vendor: true,
            items: { with: { product: true } },
            payments: true,
          },
        }),
        tx.query.productLosses.findMany({
          where: and(gte(productLosses.createdAt, start), lte(productLosses.createdAt, end)),
          with: {
            product: true,
          },
        }),
      ]);

      // 2. Process Products Stats (One pass overhead)
      let totalEquipos = 0;
      let totalModels = allProducts.length;
      let currentInventoryCost = 0;

      allProducts.forEach((p) => {
        totalEquipos += Number(p.stock || 0);
        currentInventoryCost += Number(p.purchasePrice || 0) * Number(p.stock || 0);
      });

      // 3. Process Sales (Revenue, COGS, Seller Stats)
      let totalRevenue = 0;
      let totalCostOfGoodsSold = 0;
      let cashRevenue = 0;
      let transferRevenue = 0;
      const sellerMap: Record<string, { username: string; total: number; count: number }> = {};

      salesWithItems.forEach((s: any) => {
        totalRevenue += Number(s.total);

        // COGS — uses the cost snapshot stored at time of sale (immutable)
        s.items.forEach((item: any) => {
          const unitCost = Number(item.unitCost || 0);
          totalCostOfGoodsSold += unitCost * item.quantity;
        });

        // Payments Breakdown
        if (s.payments && (s.payments as any[]).length > 0) {
          (s.payments as any[]).forEach((p) => {
            if (p.type === 'efectivo') cashRevenue += Number(p.amount);
            if (p.type === 'transferencia') transferRevenue += Number(p.amount);
          });
        }

        // Top Sellers
        const vendorId = s.vendorId || 'sistema';
        const username = s.vendor?.username || 'Sistema';
        if (!sellerMap[vendorId]) {
          sellerMap[vendorId] = { username, total: 0, count: 0 };
        }
        sellerMap[vendorId].total += Number(s.total);
        sellerMap[vendorId].count += 1;
      });

      // 4. Process Losses
      let totalLossCost = 0;
      lossesWithProducts.forEach((l: any) => {
        const purchasePrice = Number(l.product?.purchasePrice || 0);
        totalLossCost += purchasePrice * (l.quantity || 0);
      });

      // 5. Final Calculations
      const netProfit = totalRevenue - totalCostOfGoodsSold - totalLossCost;
      const topSellers = Object.values(sellerMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      return {
        totalEquipos,
        totalModels,
        totalRevenue,
        currentInventoryCost,
        netProfit,
        totalLossCost,
        topSellers,
        salesCount: salesWithItems.length,
        cashRevenue,
        transferRevenue,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('fetchDashboardStats error:', error);
    return { success: false, message: 'Error al obtener estadísticas' };
  }
}
