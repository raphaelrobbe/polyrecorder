/** Embed schema.org JSON-LD in the document. */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>>
}) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be raw JSON text, not escaped as React children.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
