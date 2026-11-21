/** Renders a JSON-LD structured-data block (server component, no client JS). */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // escape "<" so a value can never close the <script> tag
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
