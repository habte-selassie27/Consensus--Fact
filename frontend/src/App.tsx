import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useState } from "react";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";

const Home = lazy(() => import("./pages/Home"));
const History = lazy(() => import("./pages/History"));
const Result = lazy(() => import("./pages/Result"));
const Stats = lazy(() => import("./pages/Stats"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Embed = lazy(() => import("./pages/Embed"));
const Developers = lazy(() => import("./pages/Developers"));
const Governance = lazy(() => import("./pages/Governance"));

function PageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-signal" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-page px-5 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">404 — Not found</h1>
      <p className="mt-2 text-ink-dim">The page you are looking for does not exist.</p>
      <a href="/" className="mt-6 inline-block text-signal hover:underline">Go home →</a>
    </div>
  );
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 10_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="bg-void text-ink min-h-screen">
          <Navbar />
          <ScrollToTop />
          <main>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/history" element={<History />} />
                <Route path="/result/:id" element={<Result />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/embed/:id" element={<Embed />} />
                <Route path="/developers" element={<Developers />} />
                <Route path="/governance" element={<Governance />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <footer className="border-t border-line/40 py-6 text-center text-xs text-ink-dim">
            Built on{" "}
            <a
              href="https://genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-signal hover:underline"
            >
              GenLayer
            </a>
          </footer>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
