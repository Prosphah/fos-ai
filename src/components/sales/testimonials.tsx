import Image from "next/image";

import { SALES_TESTIMONIALS } from "@/lib/sales-testimonials";

export function Testimonials() {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SALES_TESTIMONIALS.map((item) => (
          <figure
            key={item.image}
            className="flex flex-col overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--sales-border)", background: "var(--sales-surface)" }}
          >
            <div
              className="relative w-full overflow-hidden border-b"
              style={{
                borderColor: "var(--sales-border)",
                background: "var(--sales-accent-softer)",
              }}
            >
              <Image
                src={item.image}
                alt={item.alt}
                width={720}
                height={1280}
                className="h-auto w-full object-contain"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            <figcaption className="flex flex-1 flex-col p-5">
              <blockquote className="flex-1 text-[14.5px] leading-7">
                {item.quote}
              </blockquote>
              <div
                className="mt-4 border-t pt-3"
                style={{ borderColor: "var(--sales-border)" }}
              >
                <p className="text-[13px] font-semibold">{item.name}</p>
                <p
                  className="mt-0.5 text-[11.5px] leading-5"
                  style={{ color: "var(--sales-text-3)" }}
                >
                  {item.context}
                </p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <p
        className="mt-5 text-[12.5px] leading-6"
        style={{ color: "var(--sales-text-3)" }}
      >
        Screenshots from the participant WhatsApp group. Twenty-nine people have been
        through this material so far. And their results speak for them.
      </p>
    </div>
  );
}