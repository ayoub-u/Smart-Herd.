import Link from "next/link";
import { Leaf } from "lucide-react";
import { APP_NAME, ROUTES } from "@/constants";

const FOOTER_LINKS = {
  Product: [
    { label: "Features",  href: ROUTES.FEATURES },
    { label: "Pricing",   href: ROUTES.PRICING  },
    { label: "Dashboard", href: ROUTES.LOGIN     },
  ],
  Company: [
    { label: "About",   href: ROUTES.ABOUT   },
    { label: "Contact", href: ROUTES.CONTACT },
    { label: "Blog",    href: "#"            },
  ],
  Legal: [
    { label: "Privacy Policy",  href: "#" },
    { label: "Terms of Service",href: "#" },
    { label: "Cookie Policy",   href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={ROUTES.HOME} className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl gradient-green flex items-center justify-center">
                <Leaf size={16} className="text-white" />
              </div>
              <span className="font-bold text-white text-lg">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Modern livestock management for the next generation of farmers.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">{group}</p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Built with ❤️ for farmers worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
