'use client';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

interface ImageLightboxProps {
  images: { url: string }[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export function ImageLightbox({ images, open, index, onClose, onIndexChange }: ImageLightboxProps) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={images.map((img) => ({ src: img.url }))}
      index={index}
      carousel={{ finite: true }}
      plugins={[Zoom]}
      on={onIndexChange ? { view: ({ index: i }) => onIndexChange(i) } : undefined}
    />
  );
}
