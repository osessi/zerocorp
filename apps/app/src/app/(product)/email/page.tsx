import { NotBuiltYet } from "../NotBuiltYet";

export const metadata = { title: "Email — ZeroCorp" };

export default function Page() {
  return (
    <NotBuiltYet
      title="Email"
      does="Your domain, SPF, DKIM and DMARC, mailboxes, forwarding, and a warm-up that runs for weeks so your first campaign reaches an inbox rather than a spam folder."
      needs="The domain, which arrives with the website. Warm-up takes two to three weeks of calendar time, so it starts as soon as the domain exists."
    />
  );
}
