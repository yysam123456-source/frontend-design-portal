export interface Env {
  PORTAL_DATA: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { searchParams } = new URL(context.request.url)
  const q = searchParams.get('q')?.toLowerCase() || ''
  const tech = searchParams.get('tech') || ''
  const category = searchParams.get('category') || ''

  const data = await context.env.PORTAL_DATA.get('components', 'json') || []

  let results = Array.isArray(data) ? data : []

  if (q) {
    results = results.filter((item: any) =>
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.tags?.some((t: string) => t.toLowerCase().includes(q))
    )
  }

  if (tech) {
    results = results.filter((item: any) =>
      item.techStack?.includes(tech)
    )
  }

  if (category) {
    results = results.filter((item: any) =>
      item.category === category
    )
  }

  return Response.json(results)
}
