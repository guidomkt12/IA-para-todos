import { useState, useEffect, useCallback } from "react";
import { n8nPost } from "@/lib/api";

interface UseN8nDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useN8nData<T = any>(clienteId: string | undefined, colecao: string): UseN8nDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await n8nPost("dados-ontrigger", { cliente_id: clienteId, colecao });
      setData(result);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  }, [clienteId, colecao]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
