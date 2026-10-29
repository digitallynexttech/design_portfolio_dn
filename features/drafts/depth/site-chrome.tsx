import { DepthFooter } from "./footer";
import { DepthHeader } from "./header";
import "./depth.css";

// Every page wears the Depth home's header and footer (Karan, 26 Oct 2026: "the current home page
// theme is final, make the other pages similarly"). The root layout puts them round each page in
// .dn-theme, which carries the home's tokens (depth.css: the shared rules read
// :is(.d-depth, .dn-theme)); the home, which has its own pair inside .d-depth, puts these away.

export function SiteHeader() {
  return (
    <div className="dn-theme">
      <DepthHeader transitionName="site-header" />
    </div>
  );
}

export function SiteFooter() {
  return (
    <div className="dn-theme">
      <DepthFooter />
    </div>
  );
}
