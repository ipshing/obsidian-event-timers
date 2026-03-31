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
    timers: EventTimer[];
}

export interface EventTimer {
    id: string;
    name: string;
    time: number;
    lastCompleted?: string;
    nextUp?: string;
}
