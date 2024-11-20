const { Plugin, PluginSettingTab, Setting } = require('obsidian');

module.exports = class MySyncPlugin extends Plugin {
    async onload() {
        // Lade Einstellungen
        await this.loadSettings();

        // Füge Plugin-Kommandos hinzu
        this.addCommand({
            id: 'run-sync',
            name: 'Run Synchronization',
            callback: () => {
                this.runSync();
            }
        });

        this.addRibbonIcon('refresh-cw', 'Run Sync', async () => {
            await this.runSync();
        });

        // Plugin-Einstellungen
        this.addSettingTab(new MySyncPluginSettingTab(this.app, this));
    }

    onunload() {
        console.log("MySyncPlugin entladen");
    }

    async runSync() {
        const fs = require('fs');
        const path = require('path');

        const baseSourceDir = this.settings.sourceDir; // Vom Benutzer gesetztes Quellverzeichnis
        const targetDir = app.vault.adapter.basePath; // Zielverzeichnis (Obsidian-Vault)
        const logEnabled = this.settings.logEnabled; // Logging aktivieren oder nicht
        const logDir = path.join(targetDir, "pages");
        const logFilePath = path.join(logDir, "log.md");
        const ordnerListe = ["pages", "assets"]; // Liste der zu synchronisierenden Ordner

        function writeLog(message) {
            if (logEnabled) {
                fs.appendFileSync(logFilePath, message + "\n", 'utf8');
            }
        }

        function syncFiles(sourceDir) {
            const timestamp = new Date().toLocaleString();
            writeLog(`\n--- Synchronisation für ${path.basename(sourceDir)} am ${timestamp} ---`);

            fs.readdirSync(sourceDir).forEach(file => {
                const sourceFilePath = path.join(sourceDir, file);
                const targetFilePath = path.join(targetDir, path.basename(sourceDir), file);
                const relativePath = path.relative(targetDir, targetFilePath);

                if (!fs.existsSync(targetFilePath)) {
                    fs.copyFileSync(sourceFilePath, targetFilePath);
                    writeLog(`Kopiert: ${relativePath}`);
                } else {
                    writeLog(`Übersprungen (bereits vorhanden): ${relativePath}`);
                }
            });
            writeLog("");
        }

        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

        ordnerListe.forEach(ordner => {
            const sourceDir = path.join(baseSourceDir, ordner);
            syncFiles(sourceDir);
        });
    }

    // Einstellungen laden
    async loadSettings() {
        this.settings = Object.assign({}, await this.loadData(), {
            sourceDir: "E:\\Schule\\Fächer\\INF\\inf 07\\KST7_Sourcesync",
            logEnabled: true
        });
    }

    // Einstellungen speichern
    async saveSettings() {
        await this.saveData(this.settings);
    }
};

// Plugin-Einstellungstab
class MySyncPluginSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

     display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Einstellungen für Synchronisation' });

        // Einstellung für den Quellordner
        new Setting(containerEl)
            .setName('Quellverzeichnis')
            .setDesc('Pfad zu dem Ordner, der synchronisiert werden soll.')
            .addText(text => {
                text
                    .setPlaceholder('Pfad zum Quellordner')
                    .setValue(this.plugin.settings.sourceDir)
                    .onChange(async (value) => {
                        this.plugin.settings.sourceDir = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.style.width = '100%'; // Breite des Textfeldes anpassen
            });

        // Einstellung für Log-Datei
        new Setting(containerEl)
            .setName('Log-Datei verwenden')
            .setDesc('Erstellt eine Log-Datei der synchronisierten Dateien.')
            .addToggle(toggle => {
                toggle
                    .setValue(this.plugin.settings.useLogFile)
                    .onChange(async (value) => {
                        this.plugin.settings.useLogFile = value;
                        await this.plugin.saveSettings();
                    });
            });
    }
}