'use client';

import Image from 'next/image';
import type { ImageProps } from 'next/image';
import {
  buildNextImageFallbackSrc,
  canUseNextImageOptimization,
  inferNextImageFallbackWidth,
} from '@/lib/image-optimization';

type ProtectedImageProps = ImageProps & {
  containerClassName?: string;
  fallbackQuality?: number;
  fallbackWidth?: number;
};

export default function ProtectedImage({
  containerClassName,
  fallbackQuality,
  fallbackWidth,
  fill,
  overrideSrc,
  quality,
  sizes,
  style,
  src,
  alt,
  className,
  priority,
  ...props
}: ProtectedImageProps) {
  const isExternal = typeof src === 'string' && /^https?:\/\//.test(src)
  const shouldUsePlainImage = isExternal && !canUseNextImageOptimization(src)
  const imageOverrideSrc = overrideSrc || (
    fill
      ? buildNextImageFallbackSrc(
          src,
          fallbackWidth ?? inferNextImageFallbackWidth(sizes, Boolean(priority)),
          fallbackQuality ?? quality,
        )
      : undefined
  )

  return (
    <div
      className={containerClassName}
      style={
        fill
          ? { position: 'absolute', inset: 0, zIndex: 0 }
          : { position: 'relative', display: 'inline-block' }
        }
    >
      {shouldUsePlainImage ? (
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
          overrideSrc={imageOverrideSrc}
          priority={priority}
          quality={quality}
          sizes={sizes}
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
