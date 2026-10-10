// A small history-based router. Links are real <a href> (they work without
// JavaScript and open in new tabs); a plain left click is handled here
// instead, so the app keeps its in-memory state, such as an answer being
// written, while the language or the screen changes.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

export interface NavigationState {
  /** Set by "Solve again": the Question screen says the marks were cleared. */
  restarted?: boolean;
}

interface Router {
  path: string;
  hash: string;
  state: NavigationState;
  navigate: (
    to: string,
    options?: { replace?: boolean; state?: NavigationState },
  ) => void;
}

const RouterContext = createContext<Router | null>(null);

export function useRouter(): Router {
  const router = useContext(RouterContext);
  if (!router) throw new Error("useRouter needs a <RouterProvider>");
  return router;
}

interface Current {
  path: string;
  hash: string;
  state: NavigationState;
  /** Increases with every navigation inside the app (0 = first page load). */
  count: number;
}

function readLocation(count: number): Current {
  return {
    path: window.location.pathname,
    hash: window.location.hash,
    state: (window.history.state as NavigationState | null) ?? {},
    count,
  };
}

/** After moving to another screen: start at the top and put focus on main. */
function settle(hash: string): void {
  const target = hash
    ? document.getElementById(decodeURIComponent(hash.slice(1)))
    : null;
  if (target) {
    target.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
  document.getElementById("icerik")?.focus({ preventScroll: true });
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Current>(() => readLocation(0));

  useEffect(() => {
    const onPopState = () =>
      setCurrent((previous) => readLocation(previous.count + 1));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (current.count > 0) settle(current.hash);
  }, [current]);

  const router: Router = {
    path: current.path,
    hash: current.hash,
    state: current.state,
    navigate(to, { replace = false, state = {} } = {}) {
      if (replace) window.history.replaceState(state, "", to);
      else window.history.pushState(state, "", to);
      setCurrent((previous) => readLocation(previous.count + 1));
    },
  };
  return (
    <RouterContext.Provider value={router}>{children}</RouterContext.Provider>
  );
}

/** For prerendering: a fixed location and no navigation. */
export function StaticRouter({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const router: Router = { path, hash: "", state: {}, navigate: () => {} };
  return (
    <RouterContext.Provider value={router}>{children}</RouterContext.Provider>
  );
}

const isPlainClick = (event: MouseEvent) =>
  event.button === 0 &&
  !event.defaultPrevented &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  state?: NavigationState;
};

/** An in-site link. External links are plain <a> elements. */
export function Link({ to, state, onClick, ...props }: LinkProps) {
  const { navigate } = useRouter();
  return (
    <a
      {...props}
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (!isPlainClick(event)) return;
        event.preventDefault();
        navigate(to, { state });
      }}
    />
  );
}
