import { getDocuments, getDocumentStats } from '@/app/actions/documents'
import { checkModuleAccess } from '@/lib/module-access'
import { DocumentsTable } from '@/components/documents/documents-table'
import { UploadDocumentButton } from '@/components/documents/document-buttons'
import { FileText, Archive, Clock, FolderOpen } from 'lucide-react'

export default async function DocumentsPage() {
  await checkModuleAccess('DOCUMENTS')
  const [documents, stats] = await Promise.all([getDocuments(), getDocumentStats()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Management</h1>
          <p className="text-slate-400">Store and organize documents</p>
        </div>
        <UploadDocumentButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><FolderOpen className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-sm text-slate-400">Total Documents</p><p className="text-2xl font-bold text-white">{stats.total}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><FileText className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-sm text-slate-400">Active</p><p className="text-2xl font-bold text-white">{stats.active}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2"><Archive className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-sm text-slate-400">Archived</p><p className="text-2xl font-bold text-white">{stats.archived}</p></div>
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No documents yet</h3>
          <p className="mt-2 text-slate-400">Upload your first document to start your digital repository.</p>
          <div className="mt-6"><UploadDocumentButton /></div>
        </div>
      ) : (
        <DocumentsTable documents={documents} />
      )}
    </div>
  )
}
