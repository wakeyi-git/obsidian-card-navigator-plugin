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

## Presets (1.0.1)

You can now create, update, and delete custom presets to quickly switch between different Card Navigator configurations:

1. Open Card Navigator settings
2. Use the preset dropdown to select, create, or manage presets
3. Apply a preset to change multiple settings at once

## Multi-language Support

Card Navigator now supports multiple languages:

- English
- Korean

The plugin will automatically use the Obsidian interface language when supported. You can contribute translations for other languages by submitting a pull request to the GitHub repository.

## Mobile Responsiveness (1.0.2)

The Card Navigator interface has been optimized for improved performance on mobile devices, providing a seamless experience across various screen sizes.

## Feedback and Support

If you encounter any issues or have suggestions for improvement, please visit the [GitHub repository](https://github.com/wakeyi-git/obsidian-card-navigator-plugin) to open an issue or contribute to the project.

## License

[MIT](LICENSE)
