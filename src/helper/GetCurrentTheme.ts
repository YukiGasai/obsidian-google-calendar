export const getCurrentTheme = () => {
    return (app.vault as any).config.theme ? ( (app.vault as any).config.theme == "obsidian" ? "dark" : "light" ) : "dark";
}