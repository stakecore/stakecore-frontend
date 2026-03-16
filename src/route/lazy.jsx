import { Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollOnMount = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [pathname]);
  return null;
};

const Lazy = ({ children }) => (
  <Suspense fallback={null}>
    {children}
    <ScrollOnMount />
  </Suspense>
);

export default Lazy;
