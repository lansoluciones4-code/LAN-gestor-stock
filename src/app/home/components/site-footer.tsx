import { Mail } from 'lucide-react';
import { CONTACT_CONFIG, SOCIAL_LINKS, CONTACT_EMAIL } from '@/lib/contact/contact.config';
import { generateWhatsAppLink } from '@/lib/contact/message-generator';

// Íconos de marca en un solo trazo (mismo patrón que src/components/contact/contact-buttons.tsx),
// pero pensados para ir en blanco sobre un fondo de color en vez de color-sobre-fondo-neutro.
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      className={className}
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' />
    </svg>
  );
}

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      className={className}
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' />
    </svg>
  );
}

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 320 512'
      className={className}
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z' />
    </svg>
  );
}

function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 448 512'
      className={className}
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z' />
    </svg>
  );
}

const socialButtonBase = 'w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110';
const contactPillBase = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm transition-transform hover:scale-105 whitespace-nowrap';

export function SiteFooter() {
  const whatsappLink = generateWhatsAppLink(CONTACT_CONFIG.phoneNumber, 'Hola! Quería hacerte una consulta.');

  return (
    <footer className='shrink-0 bg-sky-600 py-10 px-6 text-white'>
      <div className='max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-10 text-center md:text-left'>
        {/* Redes sociales */}
        <div className='flex flex-col items-center md:items-start gap-3'>
          <h3 className='font-bold text-base tracking-wide'>SEGUINOS EN:</h3>
          <div className='flex gap-3'>
            <a
              href={SOCIAL_LINKS.instagram}
              target='_blank'
              rel='noopener noreferrer'
              title='Instagram'
              className={`${socialButtonBase} bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5]`}
            >
              <InstagramGlyph className='w-5 h-5 text-white' />
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              target='_blank'
              rel='noopener noreferrer'
              title='Facebook'
              className={`${socialButtonBase} bg-[#1877F2]`}
            >
              <FacebookGlyph className='w-4 h-4 text-white' />
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target='_blank'
              rel='noopener noreferrer'
              title='TikTok'
              className={`${socialButtonBase} bg-black`}
            >
              <TikTokGlyph className='w-5 h-5 text-white' />
            </a>
          </div>
        </div>

        {/* Info del negocio */}
        <div className='space-y-1 text-sm text-white/90'>
          <p>LAN Soluciones Tecnológicas de Franco BISSIO · CUIT 20-31923402-1</p>
          <p>Avenida Guillermo Hudson 196 · Rawson - Chubut</p>
          <p>© {new Date().getFullYear()} LAN Soluciones Tecnológicas. Todos los derechos reservados.</p>
        </div>

        {/* Contacto */}
        <div className='flex flex-col items-center md:items-end gap-3'>
          <h3 className='font-bold text-base tracking-wide'>CONTACTANOS:</h3>
          <div className='flex flex-col items-center md:items-end gap-2'>
            <a
              href={whatsappLink}
              target='_blank'
              rel='noopener noreferrer'
              className={`${contactPillBase} bg-[#25D366] text-white`}
            >
              <WhatsAppGlyph className='w-4 h-4' />
              +54 9 280 477-7200
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className={`${contactPillBase} bg-[#EA4335] text-white`}
            >
              <Mail className='w-4 h-4' />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
