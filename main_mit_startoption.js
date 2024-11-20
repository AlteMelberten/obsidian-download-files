const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');

module.exports = class MySyncPlugin extends Plugin {
    async onload() {
        // Lade Einstellungen
        await this.loadSettings();

        // Synchronisation bei Start ausführen, falls aktiviert
        if (this.settings.fetchOnStartup) {
            this.runDownload();
        }

        // Füge Plugin-Kommandos hinzu
        this.addCommand({
            id: 'run-fetch',
            name: 'Run Synchronization',
            callback: () => {
                this.runDownload();
            }
        });

        this.addRibbonIcon('refresh-cw', 'Run Spindi Download', async () => {
            await this.runDownload();
        });

        // Plugin-Einstellungen
        this.addSettingTab(new MySyncPluginSettingTab(this.app, this));
    }

    onunload() {
        console.log("Spindi Download Plugin entladen");
    }

    async runDownload() {
        const fs = require('fs');
        const path = require('path');

        const baseSourceDir = this.settings.sourceDir; // Vom Benutzer gesetztes Quellverzeichnis
        const targetDir = app.vault.adapter.basePath; // Zielverzeichnis (Obsidian-Vault)
        const logEnabled = this.settings.logEnabled; // Logging aktivieren oder nicht
        const logDir = path.join(targetDir, "pages");
        const logFilePath = path.join(logDir, "log.md");
        const ordnerListe = ["pages", "assets"]; // Liste der herunterzuladenden Ordner

        function writeLog(message) {
            if (logEnabled) {
                fs.appendFileSync(logFilePath, message + "\n", 'utf8');
            }
        }

        function fetchFiles(sourceDir) {
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
            fetchFiles(sourceDir);
        });

        new Notice("Download abgeschlossen.");
    }

 // Einstellungen laden
       async loadSettings() {
       // Lade die gespeicherten Daten, wenn vorhanden
           const savedSettings = await this.loadData();

        // Verwende gespeicherte Einstellungen, wenn vorhanden, sonst Standardwerte
           this.settings = {
             sourceDir: savedSettings?.sourceDir || "E:\\Schule\\Fächer\\INF\\inf 07\\KST7_Sourcesync",
             logEnabled: savedSettings?.logEnabled ?? true,
             fetchOnStartup: savedSettings?.fetchOnStartup ?? false // Standardwert nur, wenn keine gespeicherten Daten vorhanden sind
    };
	  //console.log("Verwendete Einstellungen:", this.settings);
}



    // Einstellungen speichern
    async saveSettings() {
        await this.saveData(this.settings);
    }
};

// Plugin-Einstellungstab
// Plugin-Einstellungstab
class MySyncPluginSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Einstellungen für Download' });

        // Einstellung für den Quellordner
        new Setting(containerEl)
            .setName('Quellverzeichnis')
            .setDesc('Pfad zu dem Ordner, der runtergeladen werden soll.')
            .addText(text => {
                text
                    .setPlaceholder('Pfad zum Quellordner')
                    .setValue(this.plugin.settings.sourceDir)
                    .onChange(async (value) => {
                        this.plugin.settings.sourceDir = value;
                        await this.plugin.saveSettings(); // Stelle sicher, dass die Einstellungen gespeichert werden
                    });
                text.inputEl.style.width = '100%'; // Breite des Textfeldes anpassen
            });

        // Einstellung für Log-Datei
        new Setting(containerEl)
            .setName('Log-Datei verwenden')
            .setDesc('Erstellt eine Log-Datei der herunterzuladenden Dateien.')
            .addToggle(toggle => {
                toggle
                    .setValue(this.plugin.settings.logEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.logEnabled = value;
                        await this.plugin.saveSettings(); // Stelle sicher, dass die Einstellungen gespeichert werden
                    });
            });

        // Einstellung für Download beim Start
        new Setting(containerEl)
            .setName('Download beim Start von Obsidian')
            .setDesc('Führt den Download jedesmal beim Start von Obsidian aus.')
            .addToggle(toggle => {
                toggle
                    .setValue(this.plugin.settings.fetchOnStartup) // Setze den initialen Wert der Einstellung
                    .onChange(async (value) => {
                        this.plugin.settings.fetchOnStartup = value; // Aktualisiere die Einstellung
                        await this.plugin.saveSettings(); // Speichere die geänderte Einstellung
                    });
            });
    }
}
