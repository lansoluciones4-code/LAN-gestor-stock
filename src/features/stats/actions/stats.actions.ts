'use server';

import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { db } from '@/lib/db';
import { sales, products, productLosses, productReturns } from '@/lib/db/schema';
import { gte, lte, and } from 'drizzle-orm';
import { argDateRangeBounds } from '@/lib/utils';

export async function fetchDashboardStats(startDate?: string, endDate?: string) {
  try {
    await verifyAuthOrAdmin(false);

    const { start, end } = argDateRangeBounds(startDate, endDate);

    // Use transaction for cross-query consistency (snapshot isolation)
    const result = await db.transaction(async (tx) => {
      // 1. Fetch data in parallel
      const [allProducts, salesWithItems, lossesWithProducts, returnsInRange] = await Promise.all([
        tx.select().from(products),
        tx.query.sales.findMany({
          where: and(gte(sales.createdAt, start), lte(sales.createdAt, end)),
          with: {
            vendor: true,
            items: { with: { product: { with: { device: true } } } },
            printItems: true,
            serviceItems: true,
            payments: true,
          },
        }),
        tx.query.productLosses.findMany({
          where: and(gte(productLosses.createdAt, start), lte(productLosses.createdAt, end)),
          with: {
            product: true,
          },
        }),
        tx.query.productReturns.findMany({
          where: and(gte(productReturns.createdAt, start), lte(productReturns.createdAt, end)),
        }),
      ]);

      // 2. Process Products Stats (One pass overhead)
      let totalEquipos = 0;
      let totalModels = allProducts.length;
      let currentInventoryCost = 0;
      let lowStockCount = 0;

      allProducts.forEach((p) => {
        const stock = Number(p.stock || 0);
        totalEquipos += stock;
        currentInventoryCost += Number(p.purchasePrice || 0) * stock;
        if (stock > 0 && stock <= p.lowStockThreshold) lowStockCount += 1;
      });

      // 3. Process Sales (Revenue, COGS, Seller Stats)
      let totalRevenue = 0;
      let totalCostOfGoodsSold = 0;
      let cashRevenue = 0;
      let transferRevenue = 0;
      let debitoRevenue = 0;
      let creditoRevenue = 0;
      let techRevenue = 0;
      let libreriaRevenue = 0;
      let impresionesRevenue = 0;
      let ciberRevenue = 0;
      let tramitesRevenue = 0;
      let servicioTecnicoRevenue = 0;
      const sellerMap: Record<string, { username: string; total: number; count: number }> = {};
      const techSales: { productLabel: string; vendorUsername: string; amount: number; createdAt: Date }[] = [];

      salesWithItems.forEach((s: any) => {
        totalRevenue += Number(s.total);

        // COGS — uses the cost snapshot stored at time of sale (immutable)
        s.items.forEach((item: any) => {
          const unitCost = Number(item.unitCost || 0);
          totalCostOfGoodsSold += unitCost * item.quantity;

          const subtotal = Number(item.subtotal || 0);
          if (item.product?.device?.section === 'libreria') {
            libreriaRevenue += subtotal;
          } else {
            techRevenue += subtotal;
            const device = item.product?.device;
            techSales.push({
              productLabel: [device?.category, device?.brand, device?.name].filter(Boolean).join(' · ') || 'Producto',
              vendorUsername: s.vendor?.username || 'Sistema',
              amount: subtotal,
              createdAt: s.createdAt,
            });
          }
        });

        // Desglose por rubro — impresiones/ciber/anillados/trámites
        (s.printItems as any[]).forEach((p) => {
          const subtotal = Number(p.subtotal || 0);
          if (p.kind === 'fotocopia' || p.kind === 'impresion') impresionesRevenue += subtotal;
          else if (p.kind === 'ciber') ciberRevenue += subtotal;
          else if (p.kind === 'anillado_plastificado') libreriaRevenue += subtotal;
          else if (p.kind === 'tramite') tramitesRevenue += subtotal;
        });

        (s.serviceItems as any[]).forEach((sv) => {
          servicioTecnicoRevenue += Number(sv.subtotal || 0);
        });

        // Payments Breakdown
        if (s.payments && (s.payments as any[]).length > 0) {
          (s.payments as any[]).forEach((p) => {
            if (p.type === 'efectivo') cashRevenue += Number(p.amount);
            if (p.type === 'transferencia') transferRevenue += Number(p.amount);
            if (p.type === 'debito') debitoRevenue += Number(p.amount);
            if (p.type === 'credito') creditoRevenue += Number(p.amount);
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

      // 5. Process Returns
      let totalReturnValue = 0;
      returnsInRange.forEach((r: any) => {
        totalReturnValue += Number(r.amount || 0);
      });

      // 6. Final Calculations
      const netProfit = totalRevenue - totalCostOfGoodsSold - totalLossCost - totalReturnValue;
      const topSellers = Object.values(sellerMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      techSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        totalEquipos,
        totalModels,
        totalRevenue,
        currentInventoryCost,
        lowStockCount,
        netProfit,
        totalLossCost,
        totalReturnValue,
        topSellers,
        techSales,
        salesCount: salesWithItems.length,
        cashRevenue,
        transferRevenue,
        debitoRevenue,
        creditoRevenue,
        techRevenue,
        libreriaRevenue,
        impresionesRevenue,
        ciberRevenue,
        tramitesRevenue,
        servicioTecnicoRevenue,
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
