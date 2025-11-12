type ControlsProps = {
    scheduler: string;
    scenario: string;
    onSchedulerChange: (value: string) => void;
    onScenarioChange: (value: string) => void;
    onRun: () => void;
    onOpenCustom: () => void;
    disabled?: boolean;
};
export declare function Controls({ scheduler, scenario, onSchedulerChange, onScenarioChange, onRun, onOpenCustom, disabled }: ControlsProps): import("react/jsx-runtime").JSX.Element;
export {};
