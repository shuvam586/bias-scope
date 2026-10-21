import { useEffect, useState } from "react";
import { fetchEventsWithBias } from "../api/events";

export default function useEvents(options) {
  const [events, setEvents] = useState([]);
  const [sourceBiases, setSourceBiases] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { events: data, sourceBiases: biases } = await fetchEventsWithBias(options);
        if (cancelled) return;
        setEvents(data);
        setSourceBiases(biases);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, sourceBiases, loading, error };
}
