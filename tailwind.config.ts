import type { Config } from "tailwindcss";

// @ts-ignore
// @ts-ignore
const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['"Glacial Indifference"', 'sans-serif'],
  		},
  		fontSize: {
  			'xs': '0.9rem',
  			'sm': '1rem',        // 16px (was 14px)
  			'base': '1.125rem',  // 18px (was 16px)
  			'lg': '1.25rem',     // 20px (was 18px)
  			'xl': '1.5rem',      // 24px (was 20px)
  			'2xl': '1.875rem',   // 30px (was 24px)
  			'3xl': '2.25rem',    // 36px (was 30px)
  			'4xl': '3rem',       // 48px (was 36px)
  			'5xl': '3.75rem',    // 60px (was 48px)
  			'6xl': '4.5rem',     // 72px (was 60px)
  			'7xl': '6rem',       // 96px (was 72px)
  			'8xl': '8rem',       // 128px (was 96px)
  			'9xl': '9rem',       // 144px (was 128px)
  		},
  		screens: {
  			'wide': '1400px',
  		},
  		colors: {
  			cian: '#00a4a2',
  			lavanda: '#cc57e5',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		backgroundImage: ({ theme }) => ({
  			'logo-gradient': `linear-gradient(to right, ${theme('colors.lavanda')} 0%, #b851f9 50%, #13cdd7 100%)`,
  		}),
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
