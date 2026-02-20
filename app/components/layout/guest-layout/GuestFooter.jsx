import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Guest Footer - For public pages
 */
function GuestFooter() {
  return (
    <footer className="mt-12 bg-white border-t border-border text-text-muted">
      <div className="container-custom py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-8">
          {/* Brand / description */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <b className="text-lg font-black tracking-widest bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent drop-shadow-sm hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 transition-all duration-300">
                Job<span className="relative">
                  <span className="text-red-800 font-serif text-lg">i</span>
                </span>on
              </b>
            </div>
            <p className="text-xs sm:text-sm text-text-muted max-w-xs leading-relaxed">
              A modern hiring platform that helps companies and candidates connect
              faster and more fairly.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold text-text-dark uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm text-text-muted">
              <li>
                <Link href="/jobs" className="hover:text-primary-600 transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/sign-in?role=recruiter&redirect=post-job" className="hover:text-primary-600 transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/companies" className="hover:text-primary-600 transition-colors">
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
            <ul className="space-y-2.5 text-sm text-text-muted">
              <li>
                <Link href="/" className="hover:text-primary-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary-600 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-600 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-primary-600 transition-colors">
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
            <p className="text-xs sm:text-sm text-text-muted mb-4 leading-relaxed">
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
                  className="w-full rounded-input bg-gray-50 border border-border 
      pl-3 pr-[120px] py-2.5 text-sm outline-none text-text-dark 
      placeholder:text-text-muted focus:border-primary-500 
      focus:ring-2 focus:ring-primary-500/20 transition-all"
                />

                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 
      px-4 py-2 text-sm font-semibold bg-primary-500 
      hover:bg-primary-600 active:bg-primary-700 text-white 
      transition-colors rounded-button"
                >
                  Subscribe
                </button>
              </div>

              <p className="text-[10px] text-text-light">
                No spam. Unsubscribe anytime.
              </p>
            </form>

          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-6">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Jobion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default GuestFooter;

