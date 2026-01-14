import { withDangerousMod, ConfigPlugin } from "expo/config-plugins";
import fs from "fs";
import path from "path";

const STYLE_ITEM =
  '<item name="android:windowSplashScreenBehavior">icon_preferred</item>';
const APPCOMPAT_PARENT = 'parent="Theme.AppCompat.Light.NoActionBar"';
const SPLASH_STYLE = "Theme.App.SplashScreen";

function ensureAppCompatParent(contents: string) {
  if (!contents.includes('<style name="AppTheme"')) {
    return contents;
  }
  const match = contents.match(/<style name="AppTheme"[^>]*>/);
  if (!match) {
    return contents;
  }
  if (match[0].includes("Theme.AppCompat")) {
    return contents;
  }
  const replaced = match[0]
    .replace(/\s+parent="[^"]*"/, "")
    .replace(/<style name="AppTheme"/, `<style name="AppTheme" ${APPCOMPAT_PARENT}`);
  return contents.replace(match[0], replaced);
}

function ensureSplashScreenBehavior(contents: string) {
  if (contents.includes("windowSplashScreenBehavior")) {
    return contents;
  }
  const match = contents.match(
    new RegExp(`<style name="${SPLASH_STYLE}"[^>]*>`),
  );
  if (!match) {
    const insertion = [
      `  <style name="${SPLASH_STYLE}" parent="Theme.SplashScreen">`,
      `    ${STYLE_ITEM}`,
      "  </style>",
    ].join("\n");
    if (contents.includes("</resources>")) {
      return contents.replace("</resources>", `${insertion}\n</resources>`);
    }
    return [contents.trimEnd(), "", insertion, ""].join("\n");
  }
  return contents.replace(match[0], `${match[0]}\n    ${STYLE_ITEM}`);
}

function removeSplashBehaviorFromDefaultStyles(stylesPath: string) {
  if (!fs.existsSync(stylesPath)) {
    return;
  }
  const contents = fs.readFileSync(stylesPath, "utf8");
  if (!contents.includes("windowSplashScreenBehavior")) {
    return;
  }
  let updated = contents.replace(
    /^\s*<item name="android:windowSplashScreenBehavior">.*<\/item>\s*\n?/gm,
    "",
  );
  updated = ensureAppCompatParent(updated);
  fs.writeFileSync(stylesPath, updated);
}

function ensureV33Styles(stylesPath: string) {
  if (fs.existsSync(stylesPath)) {
    const existing = fs.readFileSync(stylesPath, "utf8");
    const updated = ensureSplashScreenBehavior(existing);
    fs.writeFileSync(stylesPath, updated);
    return;
  }

  const contents = [
    "<resources>",
    `  <style name="${SPLASH_STYLE}" parent="Theme.SplashScreen">`,
    `    ${STYLE_ITEM}`,
    "  </style>",
    "</resources>",
    "",
  ].join("\n");
  fs.mkdirSync(path.dirname(stylesPath), { recursive: true });
  fs.writeFileSync(stylesPath, contents);
}

const withSplashScreenBehaviorV33: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const valuesDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "values",
      );
      const valuesV33Dir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "values-v33",
      );
      removeSplashBehaviorFromDefaultStyles(
        path.join(valuesDir, "styles.xml"),
      );
      ensureV33Styles(path.join(valuesV33Dir, "styles.xml"));
      return config;
    },
  ]);

export default withSplashScreenBehaviorV33;
