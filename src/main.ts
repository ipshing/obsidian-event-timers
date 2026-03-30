import { Plugin } from "obsidian";
import { valid, lt } from "semver";
import { DEFAULT_SETTINGS, EventTimersSettings } from "./settings";
import { EventTimersSettingsTab } from "./ui/SettingsTab";

export default class EventTimers extends Plugin {
    settings: EventTimersSettings;

    async onload() {
        // Load settings
        await this.loadSettings();
        // Check version
        await this.runVersionCheck();
        // Set up settings tab
        this.addSettingTab(new EventTimersSettingsTab(this.app, this));

        console.log("Event Timers loaded");
    }

    onunload() {
        console.log("Event Timers unloaded");
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    async updateSettings(settings: Partial<EventTimersSettings>) {
        Object.assign(this.settings, settings);
        await this.saveData(this.settings);
    }

    async runVersionCheck() {
        // Check previous version
        if (!valid(this.settings.version)) this.settings.version = "0.0.1";
        if (lt(this.settings.version, this.manifest.version)) {
            // Run updates here

            // Update version properties in settings
            this.settings.previousVersion = this.settings.version;
            this.settings.version = this.manifest.version;
            await this.saveSettings();
        }
    }
}
