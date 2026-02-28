// apiHelpers.ts
export function handleApiError(
  error: any,
  defaultMessage: string = "An error occurred",
) {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
}

export function createErrorHandler(
  setError: (msg: string | null) => void,
  setLoading?: (loading: boolean) => void,
) {
  return (error: any, defaultMessage: string = "An error occurred") => {
    if (setLoading) setLoading(false);
    setError(handleApiError(error, defaultMessage));
  };
}
