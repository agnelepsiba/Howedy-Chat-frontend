import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './store';

// Pre-typed versions of useDispatch/useSelector — use these everywhere instead
// of the plain react-redux ones so state and dispatch are always fully typed.
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
