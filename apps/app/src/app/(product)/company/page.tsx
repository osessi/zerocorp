import { NotBuiltYet } from "../NotBuiltYet";

export const metadata = { title: "Company — ZeroCorp" };

export default function Page() {
  return (
    <NotBuiltYet
      title="Company"
      does="Choose a structure, check your eligibility, collect the documents, sign, file, and follow the entity through to the day it is registered. US LLC and C-Corp, UK Ltd and LLP, all of them filed by a ZeroCorp operator today."
      needs="The formation engine is built: catalog, eligibility, provider routing and the manual operator adapter. What is missing is the customer-facing flow on top of it, and identity documents need private storage before anyone uploads a passport."
    />
  );
}
