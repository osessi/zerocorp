import { NotBuiltYet } from "../NotBuiltYet";

export const metadata = { title: "Website — ZeroCorp" };

export default function Page() {
  return (
    <NotBuiltYet
      title="Website"
      does="Pages built from validated blocks, previewed, published to your own domain with DNS and SSL. Sites are data here, not code: one renderer, one block registry, never a per-customer application."
      needs="The block taxonomy and hero variants are still disputed (D3 and D4). Building a renderer on an undecided vocabulary means building it twice."
    />
  );
}
