import { Plugin, requireApiVersion } from "obsidian";
import { valid, lt } from "semver";
import { DEFAULT_SETTINGS, EventTimersSettings } from "./settings";
import { EventTimersSettingsTab } from "./ui/SettingsTab";
import { EVENT_TIMERS_VIEW_TYPE, EventTimersView } from "./ui/EventTimersView";

export default class EventTimers extends Plugin {
    settings: EventTimersSettings;

    async onload() {
        // Load settings
        await this.loadSettings();
        // Check version
        await this.runVersionCheck();
        // Set up settings tab
        this.addSettingTab(new EventTimersSettingsTab(this.app, this));
        // Register view
        this.registerView(EVENT_TIMERS_VIEW_TYPE, (leaf) => new EventTimersView(leaf, this));

        this.addRibbonIcon("lucide-timer", "View event timers", async () => {
            await this.activateView();
        });

        this.addCommand({
            id: "open",
            name: "Open",
            callback: async () => {
                await this.activateView();
            },
        });

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

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(EVENT_TIMERS_VIEW_TYPE).first();
        if (leaf && leaf.view instanceof EventTimersView) {
            // A leaf with the Event Timers view already exists, show that
            await workspace.revealLeaf(leaf);
        } else {
            // The view could not be found in the workspace,
            // create a new leaf in the right sidebar
            leaf = workspace.getRightLeaf(false) || undefined;
            if (leaf) await leaf.setViewState({ type: EVENT_TIMERS_VIEW_TYPE, active: true });
        }
    }
    async updateView() {
        const { workspace } = this.app;
        const leaf = workspace.getLeavesOfType(EVENT_TIMERS_VIEW_TYPE).first();
        if (leaf) {
            if (requireApiVersion("1.7.2")) {
                // Ensure view is fully loaded
                await leaf.loadIfDeferred();
            }
            if (leaf.view instanceof EventTimersView) {
                await leaf.view.refreshView();
            }
        }
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
