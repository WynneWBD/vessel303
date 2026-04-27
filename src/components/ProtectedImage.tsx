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
  src,
  alt,
  className,
  priority,
  ...props
}: ProtectedImageProps) {
  const isExternal = typeof src === 'string' && /^https?:\/\//.test(src)

  return (
    <div
      className={containerClassName}
      style={
        fill
          ? { position: 'absolute', inset: 0, zIndex: 0 }
          : { position: 'relative', display: 'inline-block' }
        }
    >
      {isExternal ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={className}
          draggable={false}
          loading={priority ? 'eager' : 'lazy'}
          style={{
            ...style,
            userSelect: 'none',
            ...(fill ? { width: '100%', height: '100%' } : null),
          }}
        />
      ) : (
        <Image
          {...props}
          src={src}
          alt={alt}
          className={className}
          fill={fill}
          priority={priority}
          draggable={false}
          style={{ ...style, userSelect: 'none' }}
        />
      )}
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
