'use client';

import Image from 'next/image';
import type { ImageProps } from 'next/image';

type ProtectedImageProps = ImageProps & {
  containerClassName?: string;
};

export default function ProtectedImage({
  containerClassName,
  fill,
  style,
  ...props
}: ProtectedImageProps) {
  return (
    <div
      className={containerClassName}
      style={
        fill
          ? { position: 'absolute', inset: 0, zIndex: 0 }
          : { position: 'relative', display: 'inline-block' }
      }
    >
      <Image
        {...props}
        fill={fill}
        draggable={false}
        style={{ ...style, userSelect: 'none' }}
      />
      {/* Transparent overlay: intercepts touch target (iOS save-image callout won't fire on a <div>)
          and blocks right-click/drag. click is NOT prevented — it bubbles to parent button/Link. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'transparent',
          pointerEvents: 'auto',
          WebkitTouchCallout: 'none',
          userSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onTouchStart={() => {}}
      />
    </div>
  );
}
