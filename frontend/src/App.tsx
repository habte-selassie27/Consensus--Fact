import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import History from "./pages/History";
import Result from "./pages/Result";
import Stats from "./pages/Stats";
import Leaderboard from "./pages/Leaderboard";
import Embed from "./pages/Embed";

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
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/result/:id" element={<Result />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/embed/:id" element={<Embed />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
