import { pgTable, uuid, varchar, timestamp, pgEnum, numeric, integer, jsonb, index, boolean } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['admin', 'vendedor']);
export const paymentTypeEnum = pgEnum('payment_type', ['efectivo', 'transferencia', 'debito', 'credito']);
export const businessSectionEnum = pgEnum('business_section', ['tech', 'impresiones', 'libreria']);
export const colorModeEnum = pgEnum('color_mode', ['color', 'blanco_y_negro']);

/** Fila única con configuración global del catálogo público (ej. mostrar precios o no). */
export const appSettings = pgTable('app_settings', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  showPrices: boolean('show_prices').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const devices = pgTable('devices', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 100 }),
  brand: varchar('brand', { length: 100 }),
  section: businessSectionEnum('section').notNull().default('tech'),
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const providers = pgTable('providers', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }).notNull().default(''),
  email: varchar('email', { length: 100 }).notNull().default(''),
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const technicalServices = pgTable('technical_services', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 150 }).notNull().unique(),
  description: varchar('description', { length: 500 }).notNull().default(''),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cards = pgTable('cards', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cardInstallments = pgTable(
  'card_installments',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    installments: integer('installments').notNull(),
    interestPercentage: numeric('interest_percentage', { precision: 5, scale: 2 }).notNull(),
  },
  (table) => [index('card_installments_card_id_idx').on(table.cardId)]
);

export const customers = pgTable('customers', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 30 }).notNull().default(''),
  email: varchar('email', { length: 100 }).notNull().default(''),
  documentNumber: varchar('document_number', { length: 20 }).notNull().default('').unique(),
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable(
  'products',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => providers.id),
    description: varchar('description', { length: 255 }).notNull().default(''),
    purchasePrice: numeric('purchase_price', { precision: 10, scale: 2 }).notNull(),
    salePrice: numeric('sale_price', { precision: 10, scale: 2 }).notNull(),
    stock: integer('stock').default(1).notNull(),
    lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
    showOnLanding: boolean('show_on_landing').default(true).notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('device_id_idx').on(table.deviceId), index('provider_id_idx').on(table.providerId)]
);

export const productImages = pgTable(
  'product_images',
  {
    publicId: varchar('public_id', { length: 255 }).primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    url: varchar('url', { length: 500 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('product_images_product_id_idx').on(table.productId)]
);

export const sales = pgTable(
  'sales',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    customerId: uuid('customer_id').references(() => customers.id),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => users.id),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    discountPercentage: numeric('discount_percentage', { precision: 5, scale: 2 }).default('0').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('sales_customer_id_idx').on(table.customerId), index('sales_vendor_id_idx').on(table.vendorId)]
);

export const saleItems = pgTable(
  'sale_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull().default('0'),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [index('sale_items_sale_id_idx').on(table.saleId), index('sale_items_product_id_idx').on(table.productId)]
);

export const salePrintItems = pgTable(
  'sale_print_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id),
    colorMode: colorModeEnum('color_mode').notNull(),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [index('sale_print_items_sale_id_idx').on(table.saleId)]
);

export const saleServiceItems = pgTable(
  'sale_service_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id),
    technicalServiceId: uuid('technical_service_id')
      .notNull()
      .references(() => technicalServices.id),
    quantity: integer('quantity').notNull().default(1),
    unitValue: numeric('unit_value', { precision: 10, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [index('sale_service_items_sale_id_idx').on(table.saleId)]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 50 }).notNull(),
    entity: varchar('entity', { length: 50 }).notNull(),
    entityId: uuid('entity_id'),
    detail: jsonb('detail'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('audit_logs_user_id_idx').on(table.userId), index('audit_logs_entity_idx').on(table.entity)]
);

export const productLosses = pgTable(
  'product_losses',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    quantity: integer('quantity').notNull(),
    reason: varchar('reason', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('loss_product_id_idx').on(table.productId), index('loss_user_id_idx').on(table.userId)]
);

export const salePayments = pgTable(
  'sale_payments',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id),
    cardId: uuid('card_id').references(() => cards.id),
    type: paymentTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    installments: integer('installments').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('sale_payments_sale_id_idx').on(table.saleId)]
);

export const productsRelations = relations(products, ({ one, many }) => ({
  device: one(devices, {
    fields: [products.deviceId],
    references: [devices.id],
  }),
  provider: one(providers, {
    fields: [products.providerId],
    references: [providers.id],
  }),
  losses: many(productLosses),
  logs: many(auditLogs),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  vendor: one(users, {
    fields: [sales.vendorId],
    references: [users.id],
  }),
  items: many(saleItems),
  printItems: many(salePrintItems),
  serviceItems: many(saleServiceItems),
  payments: many(salePayments),
}));

export const salePrintItemsRelations = relations(salePrintItems, ({ one }) => ({
  sale: one(sales, {
    fields: [salePrintItems.saleId],
    references: [sales.id],
  }),
}));

export const saleServiceItemsRelations = relations(saleServiceItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleServiceItems.saleId],
    references: [sales.id],
  }),
  technicalService: one(technicalServices, {
    fields: [saleServiceItems.technicalServiceId],
    references: [technicalServices.id],
  }),
}));

export const productLossesRelations = relations(productLosses, ({ one }) => ({
  product: one(products, {
    fields: [productLosses.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productLosses.userId],
    references: [users.id],
  }),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  logs: many(auditLogs),
  losses: many(productLosses),
}));

export const devicesRelations = relations(devices, ({ many }) => ({
  products: many(products),
  logs: many(auditLogs),
}));

export const providersRelations = relations(providers, ({ many }) => ({
  products: many(products),
  logs: many(auditLogs),
}));

export const technicalServicesRelations = relations(technicalServices, ({ many }) => ({
  saleItems: many(saleServiceItems),
  logs: many(auditLogs),
}));

export const cardsRelations = relations(cards, ({ many }) => ({
  installments: many(cardInstallments),
  payments: many(salePayments),
  logs: many(auditLogs),
}));

export const cardInstallmentsRelations = relations(cardInstallments, ({ one }) => ({
  card: one(cards, {
    fields: [cardInstallments.cardId],
    references: [cards.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
  logs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [auditLogs.entityId],
    references: [products.id],
  }),
  customer: one(customers, {
    fields: [auditLogs.entityId],
    references: [customers.id],
  }),
  provider: one(providers, {
    fields: [auditLogs.entityId],
    references: [providers.id],
  }),
  technicalService: one(technicalServices, {
    fields: [auditLogs.entityId],
    references: [technicalServices.id],
  }),
  card: one(cards, {
    fields: [auditLogs.entityId],
    references: [cards.id],
  }),
  device: one(devices, {
    fields: [auditLogs.entityId],
    references: [devices.id],
  }),
  sale: one(sales, {
    fields: [auditLogs.entityId],
    references: [sales.id],
  }),
  targetUser: one(users, {
    fields: [auditLogs.entityId],
    references: [users.id],
  }),
}));

export const salePaymentsRelations = relations(salePayments, ({ one }) => ({
  sale: one(sales, {
    fields: [salePayments.saleId],
    references: [sales.id],
  }),
  card: one(cards, {
    fields: [salePayments.cardId],
    references: [cards.id],
  }),
}));
