import { getPublicStore, getPublicProducts, getPublicCategories } from '@/app/actions/storefront'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Search, Filter, ChevronLeft } from 'lucide-react'
import { AddToCartButton } from '@/components/storefront/cart-buttons'

export default async function ProductsPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}) {
  const { slug } = await params
  const { category, search, page } = await searchParams
  
  const store = await getPublicStore(slug)
  if (!store) notFound()

  const currentPage = parseInt(page || '1')
  const limit = 12
  const offset = (currentPage - 1) * limit

  const [{ products, total }, categories] = await Promise.all([
    getPublicProducts(slug, { categorySlug: category, search, limit, offset }),
    getPublicCategories(slug)
  ])

  const totalPages = Math.ceil(total / limit)
  const currentCategory = categories.find(c => c.slug === category)

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
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href={`/store/${slug}`} className="hover:text-white">Home</Link>
          <span>/</span>
          <span className="text-white">Products</span>
          {currentCategory && (
            <>
              <span>/</span>
              <span className="text-white">{currentCategory.name}</span>
            </>
          )}
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                <Link href={`/store/${slug}/products`} className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!category ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                  All Products
                </Link>
                {categories.map(cat => (
                  <Link key={cat.id} href={`/store/${slug}/products?category=${cat.slug}`} className={`block px-3 py-2 rounded-lg text-sm transition-colors ${category === cat.slug ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                    {cat.name} <span className="text-slate-500">({cat._count.products})</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">
                {currentCategory ? currentCategory.name : 'All Products'}
                <span className="text-slate-400 font-normal text-lg ml-2">({total})</span>
              </h1>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400">No products found</p>
                <Link href={`/store/${slug}/products`} className="mt-4 inline-block text-sm underline" style={{ color: store.primaryColor }}>Clear filters</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map(product => (
                    <div key={product.id} className="group">
                      <Link href={`/store/${slug}/product/${product.slug}`}>
                        <div className="aspect-square rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 mb-3 flex items-center justify-center border border-slate-700 group-hover:border-slate-500 transition-all">
                          <span className="text-4xl font-bold text-slate-600">{product.name.charAt(0)}</span>
                        </div>
                        <h3 className="font-medium text-white group-hover:text-blue-400 truncate">{product.name}</h3>
                        <p className="text-sm text-slate-400 mb-2">{store.currency} {Number(product.price).toFixed(2)}</p>
                      </Link>
                      <AddToCartButton product={product} currency={store.currency} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {currentPage > 1 && (
                      <Link href={`/store/${slug}/products?${category ? `category=${category}&` : ''}page=${currentPage - 1}`} className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700">Previous</Link>
                    )}
                    <span className="px-4 py-2 text-slate-400">Page {currentPage} of {totalPages}</span>
                    {currentPage < totalPages && (
                      <Link href={`/store/${slug}/products?${category ? `category=${category}&` : ''}page=${currentPage + 1}`} className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700">Next</Link>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
