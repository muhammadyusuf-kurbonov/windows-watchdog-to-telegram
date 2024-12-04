import { join } from "@std/path";
import SysTray, { MenuItem } from "https://deno.land/x/systray/mod.ts";
import console from "node:console";

export class SystrayServiceModule {
  start() {
    const ItemExit: MenuItem = {
      title: "Exit",
      tooltip: "Exit the menu",
      checked: false,
      enabled: true,
    };

    const iconPath = join(
      Deno.cwd(),
      Deno.build.os === "windows" ? "/icon.ico" : "/icon.png"
    );
    console.log(iconPath);
    const systray = new SysTray({
      menu: {
        // Use .png icon in macOS/Linux and .ico format in windows
        icon: iconPath,
        // A template icon is a transparency mask that will appear to be dark in light mode and light in dark mode
        isTemplateIcon: Deno.build.os === "darwin",
        title: "Backup tool",
        tooltip: "Backup tool",
        items: [ItemExit],
      },
      debug: true, // log actions
    });

    systray.on("click", () => {
      systray.kill();
    });

    systray.on("ready", () => {
      console.log("tray started!");
    });

    systray.on("exit", () => {
      console.log("exited");
    });
    systray.on("error", (error) => {
      console.log("tray.error", error);
    });
  }
}
