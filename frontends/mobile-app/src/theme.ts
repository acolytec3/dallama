import { createSystem, defaultConfig } from '@chakra-ui/react'

export const system = createSystem(defaultConfig, {
    theme: {
        tokens: {
            colors: {
                brand: {
                    50: { value: '#e6f3ff' },
                    100: { value: '#b3d9ff' },
                    200: { value: '#80bfff' },
                    300: { value: '#4da6ff' },
                    400: { value: '#1a8cff' },
                    500: { value: '#0073e6' },
                    600: { value: '#005bb3' },
                    700: { value: '#004480' },
                    800: { value: '#002d4d' },
                    900: { value: '#00161a' },
                },
            },
            fonts: {
                heading: { value: 'system-ui, sans-serif' },
                body: { value: 'system-ui, sans-serif' },
            },
        },
        recipes: {
            button: {
                className: 'button',
                base: {
                    fontWeight: 'medium',
                    borderRadius: 'lg',
                },
                variants: {
                    size: {
                        lg: {
                            h: '48px',
                            minW: '48px',
                            fontSize: 'lg',
                            px: '6',
                        },
                        md: {
                            h: '44px',
                            minW: '44px',
                            fontSize: 'md',
                            px: '4',
                        },
                        sm: {
                            h: '36px',
                            minW: '36px',
                            fontSize: 'sm',
                            px: '3',
                        },
                    },
                },
            },
            input: {
                className: 'input',
                base: {},
                variants: {
                    size: {
                        lg: {
                            field: {
                                h: '48px',
                                fontSize: 'lg',
                                px: '4',
                            },
                        },
                        md: {
                            field: {
                                h: '44px',
                                fontSize: 'md',
                                px: '3',
                            },
                        },
                    },
                },
            },
        },
        globalCss: {
            body: {
                bg: 'gray.50',
                color: 'gray.800',
            },
        },
    },
})