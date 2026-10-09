export type ContactInfo = {
  phoneNumber: string;
  instagramUser: string;
};

export type ProductMessageData = {
  category?: string | null;
  brand?: string | null;
  model: string;
  /** Descripción real del producto (nunca el texto de relleno que muestra la ficha cuando está vacía). */
  description?: string | null;
  inStock: boolean;
};

export function generateWhatsAppMessage(product: ProductMessageData): string {
  const name = [product.category, product.brand, product.model].filter(Boolean).join(' - ');
  const description = (product.description ?? '').replace(/\s+/g, ' ').trim();
  const label = description ? `${name} (${description})` : name;

  return product.inStock
    ? `Buenas, quería saber el precio de ${label}, muchas gracias!`
    : `Buenas, quería saber si iban a traer ${label} ya que no hay stock en la tienda web, muchas gracias!`;
}

export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

export function generateInstagramLink(username: string): string {
  // Direct Message link format for Instagram
  return `https://ig.me/m/${username}`;
}
