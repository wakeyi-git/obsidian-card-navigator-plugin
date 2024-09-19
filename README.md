# Card Navigator

Card Navigator is an Obsidian plugin that offers a unique way to visualize and navigate your notes. It displays your notes as horizontally or vertically scrollable cards, making it easier to browse and manage your content.

## Features

- Display notes as cards with customizable information (filename, first header, content)
- Horizontal or vertical scrolling view
- Customizable number of cards per view
- Sort cards by various criteria (name, creation date, modification date)
- Quick navigation between cards using keyboard shortcuts
- Search functionality within the current folder
- Drag and drop support for easy note linking
- Customizable card appearance (font sizes, content length, etc.)
- Preset management for quick switching between different settings (1.0.1)
- Folder selection for viewing cards from specific folders
- Option to render card content as HTML
- Card height alignment for uniform appearance
- Keyboard navigation support for improved accessibility (1.0.2)
- Context menu for quick actions on cards (1.0.2)
- Multi-language support for English and Korean
- Responsive design for improved mobile experience (1.0.2)
- Multiple layout options: Auto, List, Grid, and Masonry (1.0.3)

![alt text](<src/screenshots/Keyboard Navigating.gif>)
![alt text](<src/screenshots/Editing Note.gif>)

## Installation

1. This plugin has not yet passed the review process in Obsidian.
2. Download the main.js, manifest.json, and styles.css files from the Releases section.
3. Create a new folder with an appropriate name inside the .obsidian/plugins/ folder and paste the files downloaded in step 2 into it.
4. Open Obsidian and go to Settings.
5. Go to Community Plugins and disable Safe Mode.
6. Activate the plugin.

## Usage

After installation, you can open the Card Navigator view by:

1. Clicking the Card Navigator icon in the left sidebar
2. Using the command palette to search for "Open Card Navigator"

### Basic Navigation

- Use the scroll wheel or trackpad to navigate between cards
- Click on a card to open the corresponding note
- Use the search bar in the toolbar to filter cards

### Customization

1. Click the settings icon in the Card Navigator toolbar
2. Adjust settings such as cards per view, card appearance, display options, etc.
3. Create and manage presets for quick setting switches

### Keyboard Shortcuts

Card Navigator supports various navigation keyboard shortcuts:

- Scroll one card up
- Scroll one card down
- Scroll one card left
- Scroll one card right
- Scroll one page up/left
- Scroll one page down/right
- Center active card
- Focus Card Navigator (1.0.2)
- Up/Down arrows: Move vertically between cards (1.0.2)
- Left/Right arrows: Move horizontally between cards (1.0.2)
- Enter: Open focused card (1.0.2)
- Context menu key or Cmd/Ctrl + E: Open context menu for focused card (1.0.2)

You can customize these shortcuts in Obsidian's hotkey settings. To set up a hotkey for these actions:

1. Go to Settings → Hotkeys
2. Search for "Card Navigator"
3. Assign your desired key combination for each action

## Settings

Card Navigator offers various customization options:

- **Container Settings**: Adjust cards per view and card alignment
- **Card Settings**: Customize information displayed on cards (filename, first header, content)
- **Appearance**: Set font sizes for various card elements
- **Sorting**: Choose default sorting method for cards
- **Folder Selection**: Option to use active file's folder or selected folder
- **Presets**: Save and load different configurations
- **Layout**: Choose between Auto, List, Grid, and Masonry layouts (1.0.3)

## Multi-language Support

Card Navigator now supports multiple languages:

- English
- Korean

The plugin will automatically use the Obsidian interface language when supported. You can contribute translations for other languages by submitting a pull request to the GitHub repository.

## Presets (1.0.1)

You can now create, update, and delete custom presets to quickly switch between different Card Navigator configurations:

1. Open Card Navigator settings
2. Use the preset dropdown to select, create, or manage presets
3. Apply a preset to change multiple settings at once

### Keyboard Navigation (1.0.2)

Card Navigator now offers comprehensive keyboard navigation support, allowing you to browse and interact with your notes efficiently without using a mouse. Here's how to use the keyboard navigation features:

1. **Focusing the Card Navigator**:
   - Use the assigned hotkey to focus the Card Navigator (configurable in Obsidian's hotkey settings).
   - When focused, the current card will be highlighted.

2. **Navigating Between Cards**:
   - Use arrow keys to move between cards:
     - Left/Right: Move horizontally between cards
     - Up/Down: Move vertically between cards
   - PageUp/PageDown: Scroll one page of cards up or down
   - Home: Move to the first card
   - End: Move to the last card

3. **Interacting with Cards**:
   - Enter: Open the focused card in Obsidian
   - Context Menu key or Cmd/Ctrl + E: Open the context menu for the focused card

4. **Context Menu Actions**:
   - When the context menu is open, use arrow keys to navigate menu items
   - Enter: Select the highlighted menu item

5. **Exiting Card Navigator Focus**:
   - Press Tab or click outside the Card Navigator to exit focus mode

The keyboard navigation works seamlessly with all layout options (Auto, List, Grid, and Masonry), adjusting its behavior based on the current layout.

### Layout Options (1.0.3)

Card Navigator now offers multiple layout options to suit your preferences:

1. Auto: Automatically adjusts between list and grid layout based on the available space
2. List: Displays cards in a single column, either vertically or horizontally
3. Grid: Arranges cards in a fixed-column grid layout
4. Masonry: Creates a dynamic grid where cards can have varying heights

To change the layout:

1. Open Card Navigator settings
2. Go to the "Layout Settings" section
3. Choose your preferred layout from the "Default Layout" dropdown
4. Adjust additional settings specific to each layout type (e.g., number of columns for Grid and Masonry layouts)

## Feedback and Support

If you encounter any issues or have suggestions for improvement, please visit the [GitHub repository](https://github.com/wakeyi-git/obsidian-card-navigator-plugin) to open an issue or contribute to the project.

## License

[MIT](LICENSE)
