export type ContactInfo = {
  phoneNumber: string;
  instagramUser: string;
};

export type ProductMessageData = {
  name: string;
  description?: string | null;
};

export function generateWhatsAppMessage(product: ProductMessageData): string {
  const baseMessage = '¡Hola ArgenStock!';
  const interestMessage = `Me interesa el *${product.name}*`;
  const descriptionPart = product.description ? ` (${product.description})` : '';
  const closing = '¿Lo tienen disponible? ¡Muchas gracias!';

  return `${baseMessage} ${interestMessage}${descriptionPart}. ${closing}`;
}

export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

export function generateInstagramLink(username: string): string {
  // Direct Message link format for Instagram
  return `https://ig.me/m/${username}`;
}
