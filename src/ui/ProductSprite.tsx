const variants = ['earbuds', 'speaker', 'watch', 'led', 'lamp', 'box']

export function ProductSprite({ productId, label }: { productId: string; label?: string }) {
  const total = [...productId].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const variant = variants[total % variants.length]
  return <span className={`product-sprite product-sprite--${variant}`} aria-label={label} role="img" />
}
