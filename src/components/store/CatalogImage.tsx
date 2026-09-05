type CatalogImageProps = {
  src?: string | null
  alt: string
  className?: string
}

export default function CatalogImage({ src, alt, className = '' }: CatalogImageProps) {
  if (src) {
    return <img src={src} alt={alt} className={className} />
  }

  return <div role="img" aria-label={alt} className={`bg-neutral-100 ${className}`} />
}
