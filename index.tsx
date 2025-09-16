/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import type { Channel } from "@vencord/discord-types";
import { findByPropsLazy } from "@webpack";
import { 
    GuildChannelStore, 
    Menu, 
    React, 
    UserStore, 
    VoiceStateStore, 
    showToast, 
    Toasts,
    Button,
    Text,
    SelectedChannelStore
} from "@webpack/common";
import { ModalRoot, ModalHeader, ModalContent, ModalFooter, ModalCloseButton, openModal, ModalProps, ModalSize } from "@utils/modal";

const { selectVoiceChannel } = findByPropsLazy("selectVoiceChannel", "selectChannel");

// Global variable to track current waiting interval
let currentWaitInterval: NodeJS.Timeout | null = null;

interface VoiceChannelContextProps {
    channel: Channel;
}

interface WaitForSlotModalProps {
    modalProps: ModalProps;
    channel: Channel;
    onConfirm: () => void;
}

function WaitForSlotModal({ modalProps, channel, onConfirm }: WaitForSlotModalProps) {
    return (
        <ModalRoot {...modalProps} size={ModalSize.SMALL}>
            <ModalHeader>
                <Text variant="heading-lg/semibold">Join Voice Channel</Text>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent>
                <Text variant="text-md/normal">
                    A slot is now available in <strong>{channel.name}</strong>. Do you want to join?
                    {channel.userLimit && (
                        <><br /><br />This channel has a limit of {channel.userLimit} users.</>
                    )}
                </Text>
            </ModalContent>
            <ModalFooter>
                <Button
                    onClick={modalProps.onClose}
                    color={Button.Colors.PRIMARY}
                    look={Button.Looks.LINK}
                >
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        onConfirm();
                        modalProps.onClose();
                    }}
                    color={Button.Colors.BRAND}
                >
                    Join Channel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

function getVoiceChannelUserCount(channelId: string): number {
    const voiceStates = VoiceStateStore.getVoiceStatesForChannel(channelId);
    return Object.keys(voiceStates).length;
}

function isChannelFull(channel: Channel): boolean {
    if (!channel.userLimit) return false;
    const currentUsers = getVoiceChannelUserCount(channel.id);
    return currentUsers >= channel.userLimit;
}

function playNotificationSound() {
    try {
        // Create a simple notification sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.warn("Could not play notification sound:", error);
    }
}

function waitForSlot(channel: Channel) {
    const checkInterval = 2000; // Check every 2 seconds
    const timeoutMinutes = settings.store.timeoutMinutes || 5; // Default to 5 minutes if undefined
    const maxWaitTime = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
    let waitTime = 0;

    // Clear any existing wait interval
    if (currentWaitInterval) {
        clearInterval(currentWaitInterval);
    }

    showToast("Waiting for a slot in " + channel.name, Toasts.Type.MESSAGE);

    const interval = setInterval(() => {
        waitTime += checkInterval;
        
        // Check if user disconnected from voice and setting is enabled
        if (settings.store.stopOnDisconnect && !SelectedChannelStore.getVoiceChannelId()) {
            clearInterval(interval);
            currentWaitInterval = null;
            showToast("Stopped waiting - you disconnected from voice", Toasts.Type.MESSAGE);
            return;
        }
        
        // Check if channel is no longer full
        if (!isChannelFull(channel)) {
            clearInterval(interval);
            currentWaitInterval = null;
            
            // Play notification sound if enabled
            if (settings.store.playSound) {
                playNotificationSound();
            }
            
            // Show confirmation modal if setting is enabled, otherwise join immediately
            if (settings.store.showConfirmation) {
                showToast("Slot available! Confirming join...", Toasts.Type.SUCCESS);
                openModal(modalProps => (
                    <WaitForSlotModal
                        modalProps={modalProps}
                        channel={channel}
                        onConfirm={() => {
                            console.log("Join Channel clicked, attempting to join:", channel.id);
                            try {
                                selectVoiceChannel(channel.id);
                                console.log("selectVoiceChannel called successfully");
                            } catch (error) {
                                console.error("Error calling selectVoiceChannel:", error);
                            }
                        }}
                    />
                ));
            } else {
                showToast("Slot available! Joining " + channel.name, Toasts.Type.SUCCESS);
                selectVoiceChannel(channel.id);
            }
            return;
        }

        // Check if max wait time exceeded
        if (waitTime >= maxWaitTime) {
            clearInterval(interval);
            currentWaitInterval = null;
            const timeoutOption = settings.store.timeoutMinutes || 5;
            const timeoutLabel = settings.def.timeoutMinutes.options.find(opt => opt.value === timeoutOption)?.label || `${timeoutOption} minutes`;
            showToast(`Timeout: No slot became available in ${channel.name} after ${timeoutLabel}`, Toasts.Type.FAILURE);
            return;
        }

        // Show progress update every 30 seconds
        if (waitTime % 30000 === 0) {
            const remainingTime = Math.ceil((maxWaitTime - waitTime) / 1000);
            showToast(`Still waiting... ${remainingTime}s remaining`, Toasts.Type.MESSAGE);
        }
    }, checkInterval);
    
    // Store the interval reference globally
    currentWaitInterval = interval;
}

const VoiceChannelContext: NavContextMenuPatchCallback = (children, { channel }: VoiceChannelContextProps) => {
    // Only for voice channels (type 2)
    if (!channel || channel.type !== 2) return;

    // Don't show if user is currently in this channel
    const currentVoiceChannelId = SelectedChannelStore.getVoiceChannelId();
    if (currentVoiceChannelId === channel.id) return;

    const currentUsers = getVoiceChannelUserCount(channel.id);
    const isFull = isChannelFull(channel);

    // Don't show if channel is empty or not full
    if (currentUsers === 0 || !isFull) return;

    const handleWaitForSlot = () => {
        waitForSlot(channel);
    };

    children.splice(
        -1,
        0,
        <Menu.MenuItem
            key="wait-for-slot"
            id="wait-for-slot"
            label="Wait for Slot"
            action={handleWaitForSlot}
        />
    );
};

const settings = definePluginSettings({
    showConfirmation: {
        type: OptionType.BOOLEAN,
        description: "Show confirmation modal when a slot becomes available",
        default: true
    },
    playSound: {
        type: OptionType.BOOLEAN,
        description: "Play notification sound when a slot becomes available",
        default: true
    },
    stopOnDisconnect: {
        type: OptionType.BOOLEAN,
        description: "Stop waiting when you disconnect from voice",
        default: true
    },
    timeoutMinutes: {
        type: OptionType.SELECT,
        description: "Maximum wait time",
        default: 5,
        options: [
            { label: "1 minute", value: 1 },
            { label: "10 minutes", value: 10 },
            { label: "1 hour", value: 60 },
            { label: "2 hours", value: 120 },
            { label: "6 hours", value: 360 },
            { label: "1 day", value: 1440 }
        ]
    }
});

export default definePlugin({
    name: "WaitForSlot",
    description: "Adds a 'Wait for Slot' button to voice channel context menus that waits until a slot becomes available",
    authors: [Devs.D3SOX],

    settings,

    contextMenus: {
        "channel-context": VoiceChannelContext
    },
});
