# vc-WaitForSlot

A Vencord plugin that adds a "Wait for Slot" button to voice channel context menus. This plugin allows you to wait until a slot becomes available in a full voice channel instead of manually checking back.

## Features

-   **Context Menu Integration**: Right-click on any voice channel to see the "Wait for Slot" option
-   **Smart Detection**: Only shows the option when the channel is actually full (at user limit)
-   **Automatic Monitoring**: Continuously checks for available slots every 2 seconds
-   **Sound Notifications**: Optional notification sound when a slot becomes available
-   **Confirmation Modal**: Optional confirmation dialog when a slot becomes available
-   **Progress Updates**: Shows remaining wait time every 30 seconds
-   **Smart Timeout**: Configurable wait times from 1 minute to 1 day
-   **Auto-Stop**: Automatically stops waiting when you disconnect from voice
-   **Immediate Join**: If a slot is already available, joins immediately

## Settings

-   **Show Confirmation Modal**: Show confirmation dialog when a slot becomes available (default: enabled)
-   **Play Sound**: Play notification sound when a slot becomes available (default: enabled)
-   **Stop on Disconnect**: Stop waiting when you disconnect from voice (default: enabled)
-   **Maximum Wait Time**: Choose from 1 minute, 10 minutes, 1 hour, 2 hours, 6 hours, or 1 day

## How It Works

1. Right-click on a voice channel that is at its user limit
2. Select "Wait for Slot" from the context menu
3. The plugin immediately starts monitoring the channel
4. When a slot becomes available:
    - Plays a notification sound (if enabled)
    - Shows confirmation modal (if enabled) or joins immediately
5. You'll receive toast notifications about the waiting status and when you successfully join

## Requirements

-   Voice channel must have a user limit set
-   Channel must be at its user limit (full)
-   You must have permission to connect to the voice channel

## Installation

1. Copy the `vc-WaitForSlot` folder to your Vencord userplugins directory
2. Restart Vencord or reload the client
3. Enable the plugin in Vencord settings

## Notes

-   You can only wait for one channel at a time
-   The plugin automatically stops monitoring when you join the channel, timeout is reached, or you disconnect from voice
-   The notification sound is a gentle tone that won't be jarring
-   All settings are persistent and remembered between sessions
