import { defineConfig } from "oxfmt";

export default defineConfig({
	tabWidth: 4,
	useTabs: true,
	trailingComma: "all",
	overrides: [
		{
			files: ["**/*.json", "**/*.jsonc", "**/*.code-snippets"],
			options: {
				trailingComma: "none",
			},
		},
	],
});
