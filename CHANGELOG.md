# Changelog

All notable changes to vc-WaitForSlot will be documented in this file.

## [1.0.0] - 2024-12-19

### Added

-   Initial release of vc-WaitForSlot plugin
-   Context menu integration for voice channels
-   Smart detection of full voice channels
-   Automatic slot monitoring every 2 seconds
-   Sound notification when slot becomes available
-   Confirmation modal when slot becomes available
-   Configurable timeout settings (1 minute to 1 day)
-   Auto-stop when disconnecting from voice
-   Progress updates every 30 seconds
-   Toast notifications for all status updates

### Features

-   **Context Menu**: "Wait for Slot" button appears on full voice channels
-   **Smart Monitoring**: Only shows option when channel is at user limit
-   **Sound Notifications**: Optional gentle notification sound
-   **Confirmation Modal**: Optional confirmation before joining
-   **Flexible Timeouts**: Choose from 1 minute, 10 minutes, 1 hour, 2 hours, 6 hours, or 1 day
-   **Auto-Stop**: Stops waiting when you disconnect from voice
-   **User Feedback**: Toast notifications for all actions

### Settings

-   Show Confirmation Modal (default: enabled)
-   Play Sound (default: enabled)
-   Stop on Disconnect (default: enabled)
-   Maximum Wait Time (default: 10 minutes)

### Technical Details

-   Built for Vencord user plugins
-   TypeScript implementation
-   Web Audio API for sound notifications
-   Proper interval management and cleanup
-   Error handling and fallbacks
