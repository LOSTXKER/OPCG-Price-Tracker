import { redirect } from "next/navigation";

export default async function CardsRedirect(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value != null) {
      const v = Array.isArray(value) ? value[0] : value;
      if (v) params.set(key, v);
    }
  }
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
