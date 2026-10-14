import Image from "next/image";

import { RevealItem } from "@/components/sales/mmb-motion";
import { SALES_TESTIMONIALS } from "@/lib/sales-testimonials";

/**
 * Testimonials for storefront variant B.
 *
 * Same proof as variant A, same data source. What changes is the card: the
 * dashed ink border and white ground of the variant B grid, because a dark
 * surface card dropped onto the paper-coloured page reads as a bug.
 *
 * The screenshots do the persuading, so the quote sits under the image rather
 * than above it, and the attribution keeps name plus context so no card is
 * signed by a first name alone.
 */
export function TestimonialsMmb() {
  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SALES_TESTIMONIALS.map((item, index) => (
          <RevealItem
            key={item.image}
            index={index}
            as="figure"
            className="mmb-tcard flex flex-col overflow-hidden"
          >
            <div className="mmb-tcard-shot">
              <Image
                src={item.image}
                alt={item.alt}
                width={720}
                height={1280}
                className="object-contain"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            <figcaption className="flex flex-1 flex-col p-5">
              <blockquote className="flex-1 text-[15px] leading-[1.55]">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div className="who mt-4">
                <span className="av" aria-hidden />
                <span className="min-w-0">
                  <strong className="block text-[14px] font-bold leading-tight">
                    {item.name}
                  </strong>
                  <span className="sub mt-0.5 block text-[13px] leading-snug">
                    {item.context}
                  </span>
                </span>
              </div>
            </figcaption>
          </RevealItem>
        ))}
      </div>

      <p className="sub mt-6 max-w-[70ch] text-[14px]">
        Screenshots from the participant WhatsApp group. Twenty-nine people have been
        through this material so far. And their results speak for them.
      </p>
    </div>
  );
}