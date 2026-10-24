import { useEffect, useState } from "react";

const TrustBadge = () => {
  const [happyClients, setHappyClients] = useState(null);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL;
    let controller;
    let isMounted = true;
    const loadHappyClients = async () => {
      if (!apiBaseUrl) {
        setStatsError("Client count is currently unavailable.");
        return;
      }

      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(`${apiBaseUrl}/api/stats/happy-clients`, { signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success || !Number.isSafeInteger(data.happyClients) || data.happyClients < 0) {
          throw new Error("Unable to load client count.");
        }
        if (isMounted) {
          setHappyClients(data.happyClients);
          setStatsError("");
        }
      } catch (error) {
        if (isMounted && error.name !== "AbortError") {
          setStatsError("Client count is currently unavailable.");
        }
      }
    };
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") loadHappyClients();
    };

    loadHappyClients();
    window.addEventListener("focus", loadHappyClients);
    document.addEventListener("visibilitychange", refreshOnVisible);

    return () => {
      isMounted = false;
      controller?.abort();
      window.removeEventListener("focus", loadHappyClients);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, []);

  return (
    <section className="flex flex-row items-center  gap-4 sm:gap-24 px-4 sm:px-16 pb-16 -mt-8">
      <div className="text-center sm:text-left">
        <h2 className="text-3xl font-bold text-blue-600" aria-live="polite">
          {happyClients === null ? "—" : happyClients.toLocaleString("en-IN")}
        </h2>
        <p className="text-gray-600">Happy Clients</p>
        {statsError ? <p className="mt-1 text-xs text-slate-500" role="status">{statsError}</p> : null}
      </div>

      <div className="text-center sm:text-left">
        <h2 className="text-3xl font-bold text-blue-600">100%</h2>
        <p className="text-gray-600">Licensed Water</p>
      </div>

      <div className="text-center sm:text-left">
        <h2 className="text-3xl font-bold text-blue-600">24h</h2>
        <p className="text-gray-600">Fast Delivery</p>
      </div>
    </section>
  );
};

export default TrustBadge;
