import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Guest Footer - For public pages
 */
function GuestFooter(){
  return (
    <footer className="mt-12 bg-white border-t border-gray-200 text-text-muted">
      <div className="container-custom px-[10%] py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-8">
          {/* Brand / description */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <b className="text-lg font-bold tracking-wide bg-gradient-to-r from-[#AD1717] via-[#971414] to-[#971414] bg-clip-text text-transparent drop-shadow-sm hover:from-[#971414] hover:via-[#811111] hover:to-[#6B0E0E] transition-all duration-300">
                Job<span className="relative">
                  <span className="text-red-800 font-bold text-lg">i</span>
                </span>on
              </b>
            </div>
            <p className="text-xs sm:text-sm text-gray-500/90 font-medium max-w-xs leading-relaxed">
              A modern hiring platform that helps companies and candidates connect
              faster and more fairly.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold text-text-dark uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-500/90 font-medium">
              <li>
                <Link href="/JobList" className="hover:text-[#AD1717] transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/sign-in?role=recruiter&redirect=post-job" className="hover:text-[#AD1717] transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/companies" className="hover:text-[#AD1717] transition-colors">
                  Companies
                </Link>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-xs font-semibold text-text-dark uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-500/90 font-medium">
              <li>
                <Link href="/" className="hover:text-[#AD1717] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#AD1717] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#AD1717] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#AD1717] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-[#AD1717] transition-colors">
                  Refund / Cancellation
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-semibold text-text-dark uppercase tracking-wider mb-4">
              Stay in the loop
            </h4>
            <p className="text-xs sm:text-sm text-gray-500/90 font-medium mb-4 leading-relaxed">
              Get curated job alerts and hiring insights in your inbox.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-2"
            >
              <div className="relative w-full">
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 
      pl-3 pr-[120px] py-2.5 text-sm outline-none text-gray-700 
      placeholder:text-gray-500 focus:border-[#BB1919] 
      focus:ring-2 focus:ring-[#BB1919]/20 transition-all"
                />

                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 
      px-4 py-2 text-sm font-semibold bg-[#BB1919] 
      hover:bg-[#AD1717] active:bg-[#971414] text-white 
      transition-colors rounded-xl"
                >
                  Subscribe
                </button>
              </div>

              <p className="text-[10px] text-gray-500/70 font-medium">
                No spam. Unsubscribe anytime.
              </p>
            </form>

          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Jobion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default GuestFooter;

