'use server';

import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { sales, products, saleItems, productLosses } from '@/lib/db/schema';
import { sum, count, gte, lte, and, eq } from 'drizzle-orm';

export async function fetchDashboardStats(startDate?: string, endDate?: string) {
  try {
    await verifyAuthOrAdmin(false);

    const start = startDate ? new Date(startDate + 'T00:00:00') : new Date(0);
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();

    // 1. Snapshot: Items in Depo & Models count
    const productStats = await db
      .select({
        totalStock: sum(products.stock),
        countModels: count(products.id),
      })
      .from(products);

    // 2. Fetch Sales in range with their items to calculate Net Profit
    const [salesWithItems, lossesWithProducts] = await Promise.all([
      db.query.sales.findMany({
        where: and(gte(sales.createdAt, start), lte(sales.createdAt, end)),
        with: {
          vendor: true,
          items: { with: { product: true } },
        },
      }),
      db.query.productLosses.findMany({
        where: and(gte(productLosses.createdAt, start), lte(productLosses.createdAt, end)),
        with: {
          product: true,
        },
      }),
    ]);

    let totalRevenue = 0;
    let totalCostOfGoodsSold = 0;
    let totalLossCost = 0;

    const sellerMap: Record<string, { username: string; total: number; count: number }> = {};

    salesWithItems.forEach((s: any) => {
      totalRevenue += Number(s.total);

      // Calculate COGS
      s.items.forEach((item: any) => {
        const purchasePrice = Number(item.product?.purchasePrice || 0);
        totalCostOfGoodsSold += purchasePrice * item.quantity;
      });

      // Seller stats
      const vendorId = s.vendorId || 'sistema';
      const username = s.vendor?.username || 'Sistema';
      if (!sellerMap[vendorId]) {
        sellerMap[vendorId] = { username, total: 0, count: 0 };
      }
      sellerMap[vendorId].total += Number(s.total);
      sellerMap[vendorId].count += 1;
    });

    // Calculate Losses Cost
    lossesWithProducts.forEach((l: any) => {
      const purchasePrice = Number(l.product?.purchasePrice || 0);
      totalLossCost += purchasePrice * (l.quantity || 0);
    });

    // Net Profit = Revenue - COGS - Losses
    const netProfit = totalRevenue - totalCostOfGoodsSold - totalLossCost;

    // 3. Current Inventory Cost (Investment - actual physical stock)
    const allProducts = await db.select().from(products);
    const currentInventoryCost = allProducts.reduce((acc: number, p: any) => acc + Number(p.purchasePrice || 0) * (p.stock || 0), 0);

    const topSellers = Object.values(sellerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      success: true,
      data: {
        totalEquipos: Number(productStats[0]?.totalStock || 0),
        totalModels: Number(productStats[0]?.countModels || 0),
        totalRevenue,
        currentInventoryCost,
        netProfit,
        totalLossCost,
        topSellers,
        salesCount: salesWithItems.length,
      },
    };
  } catch (error) {
    console.error('fetchDashboardStats error:', error);
    return { success: false, message: 'Error al obtener estadísticas' };
  }
}
