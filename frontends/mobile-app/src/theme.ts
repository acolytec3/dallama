import { extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({
    config: {
        initialColorMode: 'light',
        useSystemColorMode: false,
    },
    colors: {
        brand: {
            50: '#e6f3ff',
            100: '#b3d9ff',
            200: '#80bfff',
            300: '#4da6ff',
            400: '#1a8cff',
            500: '#0073e6',
            600: '#005bb3',
            700: '#004480',
            800: '#002d4d',
            900: '#00161a',
        },
    },
    components: {
        Button: {
            baseStyle: {
                fontWeight: 'medium',
                borderRadius: 'lg',
            },
            sizes: {
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
        Input: {
            sizes: {
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
    styles: {
        global: {
            body: {
                bg: 'gray.50',
                color: 'gray.800',
            },
        },
    },
})

