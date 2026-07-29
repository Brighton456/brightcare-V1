
-- Make verify_password and hash_password callable via RPC (grant execute)
GRANT EXECUTE ON FUNCTION public.verify_password(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.hash_password(text) TO service_role;
