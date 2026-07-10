export function SiteFooter() {
  return (
    <footer className="bg-zinc-900 text-zinc-400 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-6 bg-primary rounded-sm" />
              <span className="font-semibold text-white tracking-tight">E-WEST HUB</span>
            </div>
            <p className="text-sm leading-relaxed max-w-[30ch]">
              Official digital portal for Embakasi West Constituency. Committed to
              transparency and service delivery.
            </p>
          </div>

          <div className="space-y-4">
            <h5 className="text-sm font-semibold text-white">Office Contact</h5>
            <p className="text-sm">
              NG-CDF Office, Mowlem
              <br />
              Off Outer Ring Road
              <br />
              Nairobi, Kenya
            </p>
            <p className="text-sm">Email: info@embakasiwest.go.ke</p>
            <p className="text-sm">Phone: +254 700 000 000</p>
          </div>

          <div className="space-y-4">
            <h5 className="text-sm font-semibold text-white">Important Links</h5>
            <ul className="text-sm space-y-2">
              <li>
                <a href="https://www.ecitizen.go.ke" className="hover:text-white transition-colors">
                  eCitizen Portal
                </a>
              </li>
              <li>
                <a href="https://ngcdf.go.ke" className="hover:text-white transition-colors">
                  National Government CDF
                </a>
              </li>
              <li>
                <a href="https://nairobi.go.ke" className="hover:text-white transition-colors">
                  Nairobi County Services
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Embakasi West Constituency Office. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}