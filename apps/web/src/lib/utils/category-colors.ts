export const CATEGORY_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  code_generation:  { bg: 'bg-indigo-100', text: 'text-indigo-800', darkBg: 'dark:bg-indigo-950', darkText: 'dark:text-indigo-200' },
  data_analysis:    { bg: 'bg-teal-100', text: 'text-teal-800', darkBg: 'dark:bg-teal-950', darkText: 'dark:text-teal-200' },
  content_creation: { bg: 'bg-orange-100', text: 'text-orange-800', darkBg: 'dark:bg-orange-950', darkText: 'dark:text-orange-200' },
  research:         { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'dark:bg-purple-950', darkText: 'dark:text-purple-200' },
  translation:      { bg: 'bg-emerald-100', text: 'text-emerald-800', darkBg: 'dark:bg-emerald-950', darkText: 'dark:text-emerald-200' },
}

export function getCategoryColor(category: string) {
  const normalized = category.toLowerCase().replace(/[\s&]+/g, '_')
  return CATEGORY_COLORS[normalized] || { bg: 'bg-muted', text: 'text-muted-foreground', darkBg: 'dark:bg-muted', darkText: 'dark:text-muted-foreground' }
}
