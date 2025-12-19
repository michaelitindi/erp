import { getPublicStore, getPublicProduct, getPublicProducts } from '@/app/actions/storefront'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, ChevronLeft, Minus, Plus, Star } from 'lucide-react'
import { AddToCartButton } from '@/components/storefront/cart-buttons'

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string; productSlug: string }>
}) {
  const { slug, productSlug } = await params
  
  const [store, product] = await Promise.all([
    getPublicStore(slug),
    getPublicProduct(slug, productSlug)
  ])
  
  if (!store || !product) notFound()

  const { products: relatedProducts } = await getPublicProducts(slug, { limit: 4 })
  const related = relatedProducts.filter(p => p.id !== product.id).slice(0, 4)

  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
  const discountPercent = hasDiscount 
    ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100) 
    : 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/store/${slug}`} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: store.primaryColor }}>
                {store.name.charAt(0)}
              </div>
              <span className="text-xl font-bold text-white">{store.name}</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href={`/store/${slug}/cart`} className="relative text-slate-400 hover:text-white">
                <ShoppingBag className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link href={`/store/${slug}`} className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href={`/store/${slug}/products`} className="hover:text-white">Products</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/store/${slug}/products?category=${product.category.slug}`} className="hover:text-white">{product.category.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Product Image */}
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-700">
            <span className="text-9xl font-bold text-slate-600">{product.name.charAt(0)}</span>
          </div>

          {/* Product Info */}
          <div>
            {product.isFeatured && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 mb-4">
                <Star className="h-3 w-3" /> Featured
              </div>
            )}
            
            {product.category && (
              <Link href={`/store/${slug}/products?category=${product.category.slug}`} className="text-sm uppercase tracking-wide hover:underline" style={{ color: store.primaryColor }}>
                {product.category.name}
              </Link>
            )}
            
            <h1 className="text-4xl font-bold text-white mt-2 mb-4">{product.name}</h1>
            
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-white">{store.currency} {Number(product.price).toFixed(2)}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-slate-500 line-through">{store.currency} {Number(product.compareAtPrice).toFixed(2)}</span>
                  <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium">-{discountPercent}%</span>
                </>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-slate-400 mb-6">{product.shortDescription}</p>
            )}

            {product.description && (
              <div className="prose prose-invert prose-slate mb-8">
                <p className="text-slate-300">{product.description}</p>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {product.stockQuantity > 10 ? (
                <span className="text-green-400 text-sm">✓ In Stock</span>
              ) : product.stockQuantity > 0 ? (
                <span className="text-yellow-400 text-sm">Only {product.stockQuantity} left in stock</span>
              ) : (
                <span className="text-red-400 text-sm">Out of Stock</span>
              )}
            </div>

            {/* Add to Cart */}
            <div className="space-y-4">
              <AddToCartButton product={product} currency={store.currency} size="large" />
              
              <Link href={`/store/${slug}/cart`} className="block w-full text-center py-3 rounded-xl border border-slate-600 text-white font-medium hover:bg-slate-800 transition-colors">
                View Cart
              </Link>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map(p => (
                <Link key={p.id} href={`/store/${slug}/product/${p.slug}`} className="group">
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 mb-3 flex items-center justify-center border border-slate-700 group-hover:border-slate-500 transition-all">
                    <span className="text-4xl font-bold text-slate-600">{p.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-medium text-white group-hover:text-blue-400 truncate">{p.name}</h3>
                  <p className="text-sm text-slate-400">{store.currency} {Number(p.price).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
