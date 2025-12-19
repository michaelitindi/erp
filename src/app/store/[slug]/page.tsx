import { getPublicStore, getPublicProducts, getPublicCategories } from '@/app/actions/storefront'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Search, ChevronRight } from 'lucide-react'

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await getPublicStore(slug)
  
  if (!store) notFound()

  const [{ products: featuredProducts }, categories] = await Promise.all([
    getPublicProducts(slug, { featured: true, limit: 6 }),
    getPublicCategories(slug)
  ])

  const { products: allProducts, total } = await getPublicProducts(slug, { limit: 8 })

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
            <nav className="hidden md:flex items-center gap-6">
              <Link href={`/store/${slug}/products`} className="text-slate-300 hover:text-white transition-colors">All Products</Link>
              {categories.slice(0, 4).map(cat => (
                <Link key={cat.id} href={`/store/${slug}/products?category=${cat.slug}`} className="text-slate-300 hover:text-white transition-colors">{cat.name}</Link>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <Link href={`/store/${slug}/products`} className="text-slate-400 hover:text-white"><Search className="h-5 w-5" /></Link>
              <Link href={`/store/${slug}/cart`} className="relative text-slate-400 hover:text-white">
                <ShoppingBag className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(ellipse at 50% 0%, ${store.primaryColor}40, transparent 70%)` }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Welcome to <span style={{ color: store.primaryColor }}>{store.name}</span>
          </h1>
          {store.description && <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">{store.description}</p>}
          <Link href={`/store/${slug}/products`} className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold text-lg transition-all hover:scale-105" style={{ backgroundColor: store.primaryColor }}>
            Shop Now <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Featured Products</h2>
              <Link href={`/store/${slug}/products`} className="text-sm font-medium hover:underline" style={{ color: store.primaryColor }}>View All →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map(product => (
                <Link key={product.id} href={`/store/${slug}/product/${product.slug}`} className="group rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden hover:border-slate-500 transition-all hover:-translate-y-1">
                  <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <span className="text-6xl font-bold text-slate-600">{product.name.charAt(0)}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{product.category?.name || 'Uncategorized'}</p>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{product.name}</h3>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xl font-bold text-white">{store.currency} {Number(product.price).toFixed(2)}</span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-slate-500 line-through">{store.currency} {Number(product.compareAtPrice).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-slate-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-8">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map(cat => (
                <Link key={cat.id} href={`/store/${slug}/products?category=${cat.slug}`} className="group p-6 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-slate-500 transition-all text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${store.primaryColor}20` }}>
                    <span className="text-2xl font-bold" style={{ color: store.primaryColor }}>{cat.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-blue-400">{cat.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{cat._count.products} products</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products Preview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Latest Products</h2>
            <Link href={`/store/${slug}/products`} className="text-sm font-medium hover:underline" style={{ color: store.primaryColor }}>View All {total} Products →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {allProducts.map(product => (
              <Link key={product.id} href={`/store/${slug}/product/${product.slug}`} className="group">
                <div className="aspect-square rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 mb-3 flex items-center justify-center border border-slate-700 group-hover:border-slate-500 transition-all">
                  <span className="text-4xl font-bold text-slate-600">{product.name.charAt(0)}</span>
                </div>
                <h3 className="font-medium text-white group-hover:text-blue-400 truncate">{product.name}</h3>
                <p className="text-sm text-slate-400">{store.currency} {Number(product.price).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: store.primaryColor }}>
                {store.name.charAt(0)}
              </div>
              <span className="text-lg font-semibold text-white">{store.name}</span>
            </div>
            <p className="text-sm text-slate-400">© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
