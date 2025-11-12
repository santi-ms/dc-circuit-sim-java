import { SolveResponse } from '../api';
type CustomSolveProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (response: SolveResponse, scheduler: string) => void;
};
export declare function CustomSolve({ open, onClose, onSuccess }: CustomSolveProps): import("react/jsx-runtime").JSX.Element | null;
export {};
