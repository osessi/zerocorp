import { z } from "zod";

/**
 * ISO 3166-1 alpha-2.
 *
 * A regex of `^[A-Z]{2}$` validates the SHAPE and not the VALUE, and the difference
 * is not academic: "UK" matches it and is not a country code. The United Kingdom is
 * GB. "UK" is the single most common wrong country code there is, and a founder
 * resident in "UK" would route to no jurisdiction, match no eligibility rule, and fail
 * silently rather than loudly.
 *
 * Reference data, so it lives in contracts with the rest of the vocabulary. It changes
 * roughly once a decade.
 */
export const ISO_3166_1_ALPHA_2 = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ",
  "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS",
  "BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN",
  "CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE",
  "EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF",
  "GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM",
  "HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM",
  "JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC",
  "LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK",
  "ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA",
  "NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG",
  "PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW",
  "SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS",
  "ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO",
  "TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI",
  "VN","VU","WF","WS","YE","YT","ZA","ZM","ZW",
] as const;

const CODES = new Set<string>(ISO_3166_1_ALPHA_2);

/**
 * Codes people type that look right and are not. The message names the correct one,
 * because "invalid country code" in a form field helps nobody.
 */
const COMMON_MISTAKES: Record<string, string> = {
  UK: "GB",
  EN: "GB",
  EU: "(the EU is not a country; name the member state)",
  XK: "(Kosovo has no ISO 3166-1 alpha-2 code)",
};

export const countryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, "must be two uppercase letters")
  .superRefine((value, ctx) => {
    if (CODES.has(value)) return;
    const suggestion = COMMON_MISTAKES[value];
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: suggestion
        ? `"${value}" is not an ISO 3166-1 alpha-2 code. Use ${suggestion}.`
        : `"${value}" is not an ISO 3166-1 alpha-2 code.`,
    });
  });

export type CountryCode = z.infer<typeof countryCodeSchema>;

export function isCountryCode(value: string): boolean {
  return CODES.has(value);
}
