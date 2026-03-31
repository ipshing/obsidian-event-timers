import moment from "moment";
import { ItemView, setIcon, WorkspaceLeaf } from "obsidian";
import EventTimers from "src/main";
import { EventTimer } from "src/settings";

export const EVENT_TIMERS_VIEW_TYPE = "event-timers-view";

export class EventTimersView extends ItemView {
    private plugin: EventTimers;
    private timeoutId?: number;
    private clockEl: HTMLDivElement;
    private timersEl: HTMLDivElement;

    constructor(leaf: WorkspaceLeaf, plugin: EventTimers) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return EVENT_TIMERS_VIEW_TYPE;
    }
    getDisplayText(): string {
        return "Event Timers";
    }
    getIcon(): string {
        return "lucide-timer";
    }

    async onOpen() {
        // Remove all default elements
        this.containerEl.empty();
        // Add plugin class
        this.containerEl.addClass("event-timers-view");
        // Title
        if (this.plugin.settings.title.length > 0) {
            this.containerEl.createDiv({ cls: "title", text: this.plugin.settings.title });
        }
        // Clock
        this.clockEl = this.containerEl.createDiv({ cls: "clock", text: moment().format("h:mm:ss A") });
        if (!this.plugin.settings.showClock) {
            this.clockEl.addClass("hidden");
        }
        // Reset all button
        this.containerEl.createEl("p").createEl("button", { cls: "reset-button mod-warning", text: "Reset All" }).onclick = async () => {
            for (const timer of this.plugin.settings.timers) {
                timer.lastCompleted = null;
                timer.nextUp = null;
                // Save settings
                await this.plugin.saveSettings();
                // Refresh view
                await this.refreshView();
            }
        };

        // Timers container
        this.timersEl = this.containerEl.createDiv("timers");

        console.log(this.plugin.settings.timers);

        // Run updateView() to generate initial view
        await this.refreshView();

        // Set up an initial timeout to refresh the view
        this.startTimeout();
    }

    async onClose() {
        console.log("Closing Event timers...stopping timeout...");
        this.stopTimeout();
    }

    async refreshView() {
        // Clear any active timer
        this.stopTimeout();

        // Update the clock
        this.clockEl.setText(moment().format("h:mm:ss A"));
        if (this.plugin.settings.showClock) {
            this.clockEl.removeClass("hidden");
        } else {
            this.clockEl.addClass("hidden");
        }

        if (!this.timersEl) {
            this.timersEl = this.containerEl.createDiv("timers");
        }
        this.timersEl.empty();

        // Pull timers that have a 'nextUp' specified and sort
        const timed = this.plugin.settings.timers.filter((t) => t.nextUp);
        timed.sort((a, b) => this.sortEvents(a, b));
        // Display the timers
        for (const event of timed) {
            let clsString = "time-left";
            // Calculate time left
            const duration = moment.duration(moment(event.nextUp).diff(moment()));
            let timeLeft = "";
            // Weird trickery to show the negative only at the start
            if (moment(event.nextUp).isBefore(moment())) {
                timeLeft += "-";
                clsString += " overdue";
            }
            // Need to pad the seconds and take the absolute value of both units
            timeLeft += Math.abs(duration.minutes()) + ":" + String(Math.abs(duration.seconds())).padStart(2, "0");
            // Set up paragraph to hold event details/buttons
            const p = this.timersEl.createEl("p", { cls: "timer" });
            // Name
            p.createDiv({ cls: "timer-name", text: event.name });
            // Buttons
            const complete = p.createEl("button", { cls: "timer-button mod-cta" });
            setIcon(complete, "check");
            complete.onclick = async () => this.markComplete(event);
            const plus = p.createEl("button", { cls: "timer-button" });
            setIcon(plus, "plus");
            plus.onclick = async () => this.adjustEvent(event, 30);
            const minus = p.createEl("button", { cls: "timer-button" });
            setIcon(minus, "minus");
            minus.onclick = async () => this.adjustEvent(event, -30);
            const reset = p.createEl("button", { cls: "timer-button mod-warning" });
            setIcon(reset, "eraser");
            reset.onclick = async () => this.resetEvent(event);
            // Time left
            p.createDiv({ cls: clsString, text: timeLeft });
        }

        // Then pull timers that don't have 'nextUp' times
        const untimed = this.plugin.settings.timers.filter((t) => !t.nextUp);
        for (const event of untimed) {
            const p = this.timersEl.createEl("p", { cls: "timer" });
            // Name
            p.createDiv({ cls: "timer-name", text: event.name });
            // Buttons
            const complete = p.createEl("button", { cls: "timer-button mod-cta" });
            setIcon(complete, "check");
            complete.onclick = async () => this.markComplete(event);
            // Disable these buttons but keep them for UX consistency
            const plus = p.createEl("button", { cls: "timer-button" });
            setIcon(plus, "plus");
            plus.disabled = true;
            const minus = p.createEl("button", { cls: "timer-button" });
            setIcon(minus, "minus");
            minus.disabled = true;
            const reset = p.createEl("button", { cls: "timer-button mod-warning" });
            setIcon(reset, "eraser");
            reset.disabled = true;
            // Add a time left div for spacing
            p.createDiv("time-left");
        }

        // Set a new timeout
        this.startTimeout();
    }

    private startTimeout() {
        // Ensure any existing timeout gets stopped
        this.stopTimeout();
        // Get as close to the next full second as possible
        const delay = moment().add(1, "second").milliseconds(0).diff(moment());
        // Set a timeout and save the id
        this.timeoutId = activeWindow.setTimeout(this.refreshView.bind(this), delay);
    }

    private stopTimeout() {
        if (this.timeoutId) {
            activeWindow.clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    private sortEvents(a: EventTimer, b: EventTimer) {
        if (moment(a.nextUp).isBefore(b.nextUp)) return -1;
        else if (moment(a.nextUp).isAfter(b.nextUp)) return 1;
        else return 0;
    }

    /**
     * Mark an event as complete
     */
    private async markComplete(timer: EventTimer) {
        // Find timer in settings
        const match = this.plugin.settings.timers.find((t) => t.id == timer.id);
        if (match) {
            // Update timestamp properties
            match.lastCompleted = moment().toISOString(true);
            match.nextUp = moment().add(match.time, "seconds").toISOString(true);
            // Save settings
            await this.plugin.saveSettings();
            // Refresh view
            await this.refreshView();
        }
    }

    /**
     * Adjust the 'nextUp' time of an event
     */
    private async adjustEvent(timer: EventTimer, value: number) {
        // Find timer in settings
        const match = this.plugin.settings.timers.find((t) => t.id == timer.id);
        if (match) {
            // Update 'nextUp' property
            const nextUp = moment(match.nextUp);
            if (nextUp.isValid()) {
                match.nextUp = nextUp.add(value, "seconds").toISOString(true);
                // Save settings
                await this.plugin.saveSettings();
                // Refresh view
                await this.refreshView();
            }
        }
    }

    /**
     * Reset an event to incomplete
     */
    private async resetEvent(timer: EventTimer) {
        // Find timer in settings
        const match = this.plugin.settings.timers.find((t) => t.id == timer.id);
        if (match) {
            // Update timestamp properties
            match.lastCompleted = null;
            match.nextUp = null;
            // Save settings
            await this.plugin.saveSettings();
            // Refresh view
            await this.refreshView();
        }
    }
}
