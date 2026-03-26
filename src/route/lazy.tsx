import { Suspense } from "react";
import { PreloaderContent } from "~/components/ui/preloader";

const Lazy = ({ children }) => (
  <Suspense fallback={<div className="preloader"><PreloaderContent /></div>}>
    {children}
  </Suspense>
);

export default Lazy;
