import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — E-WEST Hub" },
      {
        name: "description",
        content: "Get in touch with the Embakasi West Constituency office.",
      },
      { property: "og:title", content: "Contact — E-WEST Hub" },
      {
        property: "og:description",
        content: "Visit, call or email the Embakasi West Constituency office.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <header className="mb-12 max-w-2xl">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-primary text-[11px] font-semibold uppercase tracking-wider mb-4">
          Contact
        </span>
        <h1 className="text-4xl font-semibold mb-4">Reach the constituency office</h1>
        <p className="text-muted-foreground text-pretty">
          Walk in, call, or send an email — we respond to residents within two working days.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl ring-1 ring-black/5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Office
          </h2>
          <p className="text-lg font-medium mb-1">NG-CDF Embakasi West</p>
          <p className="text-muted-foreground">
            Mowlem, Off Outer Ring Road
            <br />
            Nairobi, Kenya
          </p>
          <p className="text-muted-foreground mt-4 text-sm">
            Mon – Fri: 8:00 AM – 5:00 PM
            <br />
            Sat: 9:00 AM – 1:00 PM
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl ring-1 ring-black/5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Get in touch
          </h2>
          <p className="mb-2">
            <span className="text-muted-foreground text-sm">Email</span>
            <br />
            <a href="mailto:info@embakasiwest.go.ke" className="font-medium text-primary">
              info@embakasiwest.go.ke
            </a>
          </p>
          <p className="mb-2">
            <span className="text-muted-foreground text-sm">Phone</span>
            <br />
            <a href="tel:+254700000000" className="font-medium">
              +254 700 000 000
            </a>
          </p>
          <p>
            <span className="text-muted-foreground text-sm">Postal</span>
            <br />
            <span className="font-medium">P.O Box 12345 – 00100, Nairobi</span>
          </p>
        </div>
      </div>
    </div>
  );
}