# Card Navigator

Card Navigator is a unique Obsidian plugin that provides a visual and intuitive way to navigate and manage your notes. It displays notes as cards that can be scrolled horizontally or vertically, making content navigation more seamless.

---

## Features

### 1. Core Features
- Display notes as cards with customizable information (file name, first header, content).
- Horizontal or vertical scroll view.
- Adjustable number of cards per view.
- Card height alignment for uniform appearance.
- Customizable card appearance (font size, content length, etc.).
- Sort cards by various criteria (name, creation date, modification date).
- Search within the current folder.
- Drag-and-drop support for easy note linking.
- Folder selection to view cards from a specific folder.
- Option to render card content as HTML.

![alt text](<src/screenshots/Keyboard Navigating.gif>)
![alt text](<src/screenshots/Editing Note.gif>)

### 2. Presets
Card Navigator now supports presets, allowing you to save and quickly switch between various settings. This feature enhances workflow flexibility in viewing and interacting with notes.
- **Custom Preset Creation:** Save the current Card Navigator settings as a named preset for future use.
- **Global Presets:** Set a default preset applied across all folders (unless overridden by folder-specific settings).
- **Folder-Specific Presets:** Assign different presets to specific folders for customized views based on folder structure.
- **Automatic Preset Application:** Automatically apply the appropriate preset when switching folders.
- **Import/Export Presets:** Share presets or back up your settings by importing or exporting them as files.
- **Preset Management:** Edit, duplicate, or delete existing presets directly in the settings panel.

**How to Use Presets:**
- **Create a Preset:**
  1. Navigate to Card Navigator settings.
  2. Configure your desired settings.
  3. Click the "+" button in the Preset Management section.
  4. Name the preset and optionally add a description.
- **Apply a Preset:**
  - **Global:** Toggle the preset to use it as the global default.
  - **Folder-Specific:** Assign a preset to a folder in the Folder Preset section.
- **Enable Automatic Application:**
  1. Activate "Automatic Preset Application" in the settings.
  2. Card Navigator will switch presets automatically based on the current folder.
- **Import/Export Presets:**
  - Use the Import/Export buttons in the Preset Management section.
  - Exported presets are saved as JSON files for easy sharing or backup.

Presets let you tailor Card Navigator's behavior for different parts of your vault or note types, enhancing productivity and note-taking experience.

### 3. Keyboard Navigation
Card Navigator provides comprehensive keyboard navigation support, enabling efficient note browsing and interaction without using a mouse.

**How to Use Keyboard Navigation:**
- **Focusing Card Navigator:**
  - Use an assigned shortcut to focus on Card Navigator (configurable in Obsidian's Hotkey settings).
  - The current card will be highlighted once focused.
- **Navigating Between Cards:**
  - Use arrow keys for navigation:
    - Left/Right: Move horizontally between cards.
    - Up/Down: Move vertically between cards.
  - **PageUp/PageDown:** Scroll up or down a page of cards.
  - **Home:** Jump to the first card.
  - **End:** Jump to the last card.
- **Interacting with Cards:**
  - **Enter:** Open the focused card in Obsidian.
  - **Context Menu Key or Custom Shortcut:** Open the context menu for the focused card.
- **Exiting Focus:**
  - Press **Tab** or click outside Card Navigator to exit focus mode.

Keyboard navigation works seamlessly with all layout options (Auto, List, Grid, Masonry), adjusting behavior based on the current layout.

### 4. Layout Options: Auto, List, Grid, Masonry
Card Navigator now supports various layout options to match user preferences:
- **Auto:** Automatically adjusts between List and Grid layouts based on available space.
- **List:** Displays cards in a single column, either vertically or horizontally.
- **Grid:** Arranges cards in a fixed-column grid layout.
- **Masonry:** Creates a dynamic grid where card heights vary.

**To change the layout:**
1. Open Card Navigator settings.
2. Navigate to the "Layout Settings" section.
3. Select the desired layout from the "Default Layout" dropdown.
4. Adjust additional settings specific to the layout (e.g., the number of columns for Grid and Masonry layouts).

### 5. Multilingual Support: English and Korean
Card Navigator now supports:
- **English**
- **Korean**

The plugin automatically uses the Obsidian interface language if supported.

---

## Installation

1. Open Obsidian and navigate to Settings.
2. Go to **Community Plugins** and disable Safe Mode.
3. Search for "Card Navigator" in the community plugin browser and install it.
4. Enable the plugin.

---

## Usage

1. After installation, open the Card Navigator view:
   - Click the Card Navigator icon in the left sidebar.
   - Search "Open Card Navigator" in the Command Palette.
2. **Basic Navigation:**
   - Use the scroll wheel or trackpad to navigate between cards.
   - Click a card to open the corresponding note.
   - Use the toolbar's search bar to filter cards.
3. **Customization:**
   - Click the settings icon in the Card Navigator toolbar.
   - Adjust settings such as the number of cards per view, card appearance, and display options.
   - Create and manage presets for quick setting changes.
4. **Keyboard Shortcuts:**
Card Navigator supports various navigation keyboard shortcuts:
  - Open the Card Navigator plugin
  - Move focus to Card Navigator (use the following keys to navigate after focusing):
    - Up/Down Arrow: Move vertically between cards
    - Left/Right Arrow: Move horizontally between cards
    - Enter: Open the focused card
    - Context Menu Key or Cmd/Ctrl + E: Open the context menu for the focused card

Shortcuts can be customized in Obsidian's Hotkey settings.

---

## Feedback and Support

If you encounter issues or have suggestions for improvement, visit the [GitHub Repository](https://github.com/wakeyi-git/obsidian-card-navigator-plugin) to open an issue or contribute to the project.

---

## License

[MIT](LICENSE)
