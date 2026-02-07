'use client'

import { useEditorStore } from '@/stores/editor-store'

export function FilterBar() {
  const images = useEditorStore((state) => state.images)
  const filterFlag = useEditorStore((state) => state.filterFlag)
  const filterRating = useEditorStore((state) => state.filterRating)
  const setFilterFlag = useEditorStore((state) => state.setFilterFlag)
  const setFilterRating = useEditorStore((state) => state.setFilterRating)
  const getFilteredImages = useEditorStore((state) => state.getFilteredImages)

  const filteredCount = getFilteredImages().length
  const pickedCount = images.filter((img) => img.flagStatus === 'picked').length
  const rejectedCount = images.filter((img) => img.flagStatus === 'rejected').length
  const hasActiveFilter = filterFlag !== 'all' || filterRating > 0

  return (
    <div className="h-8 bg-dark-800 border-b border-dark-600 flex items-center px-4 gap-3 shrink-0">
      {/* Flag filter pills */}
      <div className="flex items-center gap-1">
        <FilterPill
          label="All"
          active={filterFlag === 'all'}
          onClick={() => setFilterFlag('all')}
        />
        <FilterPill
          label={`Picked${pickedCount > 0 ? ` (${pickedCount})` : ''}`}
          active={filterFlag === 'picked'}
          onClick={() => setFilterFlag(filterFlag === 'picked' ? 'all' : 'picked')}
          color="green"
          title="Press P to pick an image"
        />
        <FilterPill
          label={`Rejected${rejectedCount > 0 ? ` (${rejectedCount})` : ''}`}
          active={filterFlag === 'rejected'}
          onClick={() => setFilterFlag(filterFlag === 'rejected' ? 'all' : 'rejected')}
          color="red"
          title="Press X to reject an image"
        />
        <FilterPill
          label="Unflagged"
          active={filterFlag === 'unflagged'}
          onClick={() => setFilterFlag(filterFlag === 'unflagged' ? 'all' : 'unflagged')}
          title="Press U to unflag an image"
        />
      </div>

      <div className="h-4 w-px bg-dark-500" />

      {/* Star rating filter */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-500 mr-1">Min</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setFilterRating(filterRating === star ? 0 : star)}
            className="p-0"
          >
            <svg
              className={`w-3 h-3 ${
                star <= filterRating ? 'text-yellow-400' : 'text-gray-600'
              } transition-colors hover:text-yellow-300`}
              fill={star <= filterRating ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-dark-500" />

      {/* Image count */}
      <span className="text-[10px] text-gray-500">
        {hasActiveFilter ? `${filteredCount} / ${images.length}` : `${images.length}`} images
      </span>

      {/* Clear filters */}
      {hasActiveFilter && (
        <button
          onClick={() => {
            setFilterFlag('all')
            setFilterRating(0)
          }}
          className="text-[10px] text-gray-500 hover:text-white transition-colors ml-auto"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

function FilterPill({
  label,
  active,
  onClick,
  color,
  title,
}: {
  label: string
  active: boolean
  onClick: () => void
  color?: 'green' | 'red'
  title?: string
}) {
  const colorClasses = active
    ? color === 'green'
      ? 'bg-green-900/40 text-green-400 border-green-700'
      : color === 'red'
      ? 'bg-red-900/40 text-red-400 border-red-700'
      : 'bg-accent/20 text-accent-light border-accent'
    : 'bg-transparent text-gray-500 border-dark-500 hover:text-gray-300 hover:border-dark-400'

  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${colorClasses}`}
    >
      {label}
    </button>
  )
}
