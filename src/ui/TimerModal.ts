import { Modal, Notice, Setting } from "obsidian";
import EventTimers from "src/main";
import { Timer } from "src/settings";

export default class TimerModal extends Modal {
    private name: string;
    private time: number;

    constructor(plugin: EventTimers, editTimer?: Timer, onSave?: (timer: { name: string; time: number }) => void) {
        super(plugin.app);
        const { contentEl } = this;
        this.name = editTimer?.name;
        this.time = editTimer?.time;

        if (editTimer) {
            this.setTitle("Edit Timer");
        } else {
            this.setTitle("Add Timer");
        }
        new Setting(contentEl)
            .setName("Name")
            .setDesc("The text to be displayed for the timer. Shorter values will display better.")
            .addText((text) => {
                text.setValue(editTimer?.name).onChange((value) => {
                    this.name = value;
                });
            });
        new Setting(contentEl)
            .setName("Time")
            .setDesc("The number of seconds the timer should count down from when started.")
            .addText((text) => {
                text.setValue(editTimer?.time.toString()).onChange((value) => {
                    const int = parseInt(value);
                    if (int) this.time = int;
                });
            });
        new Setting(contentEl).addButton((button) => {
            button
                .setButtonText("Save")
                .setCta()
                .onClick(() => {
                    // Validate the fields
                    if (this.name.length < 1) {
                        new Notice("Name field cannot be empty");
                        return;
                    } else if (!this.time || this.time < 1) {
                        new Notice("Time must be an integer greather than 0");
                        return;
                    }
                    // Close the modal
                    this.close();
                    // Call onSubmit to return the result
                    onSave({ name: this.name, time: this.time });
                });
        });
    }
}
