import { defineConfig } from "@chakra-ui/react"
import { createSystem } from "@chakra-ui/react"

const config = defineConfig({
    theme: {
        semanticTokens: {
            colors: {
                // Background colors
                bg: {
                    DEFAULT: {
                        value: { _light: "{colors.gray.50}", _dark: "{colors.gray.900}" },
                    },
                    card: {
                        value: { _light: "{colors.white}", _dark: "{colors.gray.800}" },
                    },
                    subtle: {
                        value: { _light: "{colors.gray.100}", _dark: "{colors.gray.800}" },
                    },
                },
                // Text colors
                fg: {
                    DEFAULT: {
                        value: { _light: "{colors.gray.800}", _dark: "{colors.gray.100}" },
                    },
                    muted: {
                        value: { _light: "{colors.gray.600}", _dark: "{colors.gray.300}" },
                    },
                    subtle: {
                        value: { _light: "{colors.gray.500}", _dark: "{colors.gray.400}" },
                    },
                },
                // Border colors
                border: {
                    DEFAULT: {
                        value: { _light: "{colors.gray.200}", _dark: "{colors.gray.700}" },
                    },
                },
                // Button colors - softer for dark mode to avoid blinding
                button: {
                    primary: {
                        value: { _light: "{colors.blue.500}", _dark: "{colors.blue.400}" },
                    },
                    recording: {
                        value: { _light: "{colors.red.500}", _dark: "{colors.red.400}" },
                    },
                    text: {
                        value: { _light: "{colors.white}", _dark: "{colors.gray.900}" },
                    },
                },
                // Error colors - softer for dark mode
                error: {
                    text: {
                        value: { _light: "{colors.red.600}", _dark: "{colors.red.300}" },
                    },
                    bg: {
                        value: { _light: "{colors.red.50}", _dark: "{colors.red.900}" },
                    },
                    border: {
                        value: { _light: "{colors.red.200}", _dark: "{colors.red.700}" },
                    },
                },
                // Status colors
                status: {
                    transcribing: {
                        value: { _light: "{colors.blue.500}", _dark: "{colors.blue.400}" },
                    },
                },
            },
        },
    },
})

export const system = createSystem(config) 