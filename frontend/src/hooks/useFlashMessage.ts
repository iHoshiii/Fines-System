import { useState, useCallback } from 'react';

export function useFlashMessage(durationMs = 3000) {
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const showSuccess = useCallback((msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), durationMs);
    }, [durationMs]);

    const showError = useCallback((msg: string) => {
        setError(msg);
    }, []);

    const clearMessages = useCallback(() => {
        setSuccess(null);
        setError(null);
    }, []);

    return { success, error, setError, showSuccess, showError, clearMessages };
}
