import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useUnsavedChanges({ isDirty, isSubmitting = false }) {
  const navigate = useNavigate();
  const [pendingDestination, setPendingDestination] = useState(null);

  useEffect(() => {
    if (!isDirty || isSubmitting) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  const requestNavigation = useCallback((destination) => {
    if (!isDirty || isSubmitting) {
      navigate(destination);
      return;
    }
    setPendingDestination(destination);
  }, [isDirty, isSubmitting, navigate]);

  const discardAndLeave = useCallback(() => {
    const destination = pendingDestination;
    setPendingDestination(null);
    if (destination) navigate(destination);
  }, [navigate, pendingDestination]);

  const stay = useCallback(() => setPendingDestination(null), []);

  return {
    confirmOpen: Boolean(pendingDestination),
    discardAndLeave,
    requestNavigation,
    stay,
  };
}
