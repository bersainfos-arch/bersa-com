import { expect, it } from "vitest";
import { convertedAmount,courseAccess,SLIDE_INTERVAL,SLIDE_LIMIT,currencies } from "@/lib/community";
it("changes publication slides every four seconds",()=>expect(SLIDE_INTERVAL).toBe(4000));
it("limits publication slides to twenty",()=>expect(SLIDE_LIMIT).toBe(20));
it("supports the five requested currencies",()=>expect(currencies).toEqual(["USD","CDF","XAF","XOF","EUR"]));
it("never invents a conversion without a rate",()=>expect(convertedAmount(7,"CDF")).toBeNull());
it("converts only using the supplied rate",()=>expect(convertedAmount(7,"CDF",2800)).toBe(19600));
it("blocks courses while payment is pending",()=>expect(courseAccess("pending")).toBe(false));
it("allows courses after confirmation",()=>expect(courseAccess("active")).toBe(true));