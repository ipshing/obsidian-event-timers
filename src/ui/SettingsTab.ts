import { App, PluginSettingTab, SettingGroup } from "obsidian";
import EventTimers from "../main";
import TimerModal from "./TimerModal";

export class EventTimersSettingsTab extends PluginSettingTab {
    plugin: EventTimers;

    constructor(app: App, plugin: EventTimers) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.addClass("event-timers-settings");

        new SettingGroup(containerEl)
            .addSetting((setting) => {
                setting
                    .setName("Title")
                    .setDesc("Customize the title displayed when viewing the plugin. Leave blank to have no title displayed.")
                    .addText((text) => {
                        text.setValue(this.plugin.settings.title).onChange(async (value) => {
                            await this.plugin.updateSettings({ title: value });
                        });
                    });
            })
            .addSetting((setting) => {
                setting
                    .setName("Show clock")
                    .setDesc("Display the current local time.")
                    .addToggle((toggle) => {
                        toggle.setValue(this.plugin.settings.showClock).onChange(async (value) => {
                            await this.plugin.updateSettings({ showClock: value });
                        });
                    });
            });

        const timerGroup = new SettingGroup(containerEl)
            .setHeading("Timers")
            .addClass("timers-group")
            .addSetting((setting) => {
                setting
                    .setDesc(
                        'Custom timers are listed below. To create a new timer, use the button to the right. Timers will be displayed in the order listed, but will be divided into "active" and "inactive" groups.',
                    )
                    .addButton((button) => {
                        button
                            .setButtonText("Add Timer")
                            .setCta()
                            .onClick(async () => {
                                new TimerModal(this.plugin, null, async (timer) => {
                                    // Add timer to end of settings.timers
                                    this.plugin.settings.timers.push(timer);
                                    // Save settings
                                    await this.plugin.saveSettings();
                                    // Refresh view
                                    this.display();
                                }).open();
                            });
                    });
            });

        for (let i = 0; i < this.plugin.settings.timers.length; i++) {
            const timer = this.plugin.settings.timers[i];
            timerGroup.addSetting((setting) => {
                setting.setClass("timer-setting");

                const desc = document.createDocumentFragment();
                const name = desc.createDiv();
                name.createEl("strong", { text: "Name: " });
                name.createEl("span", { text: timer.name });
                const time = desc.createDiv();
                time.createEl("strong", { text: "Time: " });
                time.createEl("span", { text: `${timer.time} seconds` });
                setting.setDesc(desc);

                setting.addButton((button) => {
                    button
                        .setIcon("lucide-edit")
                        .setTooltip("Edit timer")
                        .onClick(async () => {
                            new TimerModal(this.plugin, timer, async (result) => {
                                // Update values
                                timer.name = result.name;
                                timer.time = result.time;
                                // Save settings
                                await this.plugin.saveSettings();
                                // Refresh view
                                this.display();
                            }).open();
                        });
                });
                setting.addButton((button) => {
                    button
                        .setIcon("lucide-move-up")
                        .setTooltip("Move timer up")
                        .setDisabled(i == 0)
                        .onClick(async () => {
                            // Remove from list (but save)
                            const timer = this.plugin.settings.timers.splice(i, 1);
                            // Add in at previous index
                            this.plugin.settings.timers.splice(i - 1, 0, ...timer);
                            // Save settings
                            await this.plugin.saveSettings();
                            // Refresh view
                            this.display();
                        });
                });
                setting.addButton((button) => {
                    button
                        .setIcon("lucide-move-down")
                        .setTooltip("Move timer down")
                        .setDisabled(i == this.plugin.settings.timers.length - 1)
                        .onClick(async () => {
                            // Remove from list (but save)
                            const timer = this.plugin.settings.timers.splice(i, 1);
                            // Add in at next index
                            this.plugin.settings.timers.splice(i + 1, 0, ...timer);
                            // Save settings
                            await this.plugin.saveSettings();
                            // Refresh view
                            this.display();
                        });
                });
                setting.addButton((button) => {
                    button
                        .setIcon("lucide-trash-2")
                        .setTooltip("Delete timer")
                        .setWarning()
                        .onClick(async () => {
                            // Remove from list
                            this.plugin.settings.timers.splice(i, 1);
                            // Save settings
                            await this.plugin.saveSettings();
                            // Refresh view
                            this.display();
                        });
                });
            });
        }
    }
}
