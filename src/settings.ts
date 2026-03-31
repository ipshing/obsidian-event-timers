export const DEFAULT_SETTINGS: EventTimersSettings = {
    version: "",
    previousVersion: "",
    title: "",
    showClock: true,
    timers: [],
};

export interface EventTimersSettings {
    version: string;
    previousVersion: string;
    title: string;
    showClock: boolean;
    timers: Timer[];
}

export interface Timer {
    name: string;
    time: number;
    lastCompleted?: string;
    nextUp?: string;
}
