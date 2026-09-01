import { NotBuiltYet } from "../NotBuiltYet";

export const metadata = { title: "Settings — ZeroCorp" };

export default function Page() {
  return (
    <NotBuiltYet
      title="Settings"
      does="Your plan, your billing, your credits and their ledger, the people who can reach this business, and what you want to be notified about."
      needs="Billing. Stripe is not connected yet, so there is no subscription to show and no invoice to render."
    />
  );
}
