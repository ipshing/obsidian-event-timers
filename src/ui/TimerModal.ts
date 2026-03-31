import { randomUUID } from "crypto";
import { Modal, Notice, Setting } from "obsidian";
import EventTimers from "src/main";
import { Timer } from "src/settings";

export default class TimerModal extends Modal {
    constructor(plugin: EventTimers, editTimer?: Timer, onSave?: (result: Timer) => void) {
        super(plugin.app);
        const { contentEl } = this;
        const result: Timer = {
            id: randomUUID(),
            name: "",
            time: -1,
        };
        if (editTimer) {
            // Assign existing properties
            result.id = editTimer.id;
            result.name = editTimer.name;
            result.time = editTimer.time;
            result.lastCompleted = editTimer.lastCompleted;
            result.nextUp = editTimer.nextUp;
            this.setTitle("Edit Timer");
        } else {
            this.setTitle("Add Timer");
        }
        new Setting(contentEl)
            .setName("Name")
            .setDesc("The text to be displayed for the timer. Shorter values will display better.")
            .addText((text) => {
                text.setValue(editTimer?.name).onChange((value) => {
                    result.name = value;
                });
            });
        new Setting(contentEl)
            .setName("Time")
            .setDesc("The number of seconds the timer should count down from when started.")
            .addText((text) => {
                text.setValue(editTimer?.time.toString()).onChange((value) => {
                    const int = parseInt(value);
                    if (int) result.time = int;
                });
            });
        new Setting(contentEl).addButton((button) => {
            button
                .setButtonText("Save")
                .setCta()
                .onClick(() => {
                    // Validate the fields
                    if (result.name.length < 1) {
                        new Notice("Name field cannot be empty");
                        return;
                    } else if (!result.time || result.time < 1) {
                        new Notice("Time must be an integer greather than 0");
                        return;
                    }
                    // Close the modal
                    this.close();
                    // Call onSubmit to return the result
                    onSave(result);
                });
        });
    }
}
