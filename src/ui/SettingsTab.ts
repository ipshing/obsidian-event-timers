import { App, PluginSettingTab } from "obsidian";
import EventTimers from "../main";

export class EventTimersSettingsTab extends PluginSettingTab {
    plugin: EventTimers;

    constructor(app: App, plugin: EventTimers) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
    }
}
