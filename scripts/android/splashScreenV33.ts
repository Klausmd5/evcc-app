import { withDangerousMod, ConfigPlugin } from "expo/config-plugins";
import fs from "fs";
import path from "path";

const STYLE_ITEM =
  '<item name="android:windowSplashScreenBehavior">icon_preferred</item>';

function removeSplashBehaviorFromDefaultStyles(stylesPath: string) {
  if (!fs.existsSync(stylesPath)) {
    return;
  }
  const contents = fs.readFileSync(stylesPath, "utf8");
  if (!contents.includes(STYLE_ITEM)) {
    return;
  }
  const updated = contents
    .split("\n")
    .filter((line) => line.trim() !== STYLE_ITEM)
    .join("\n");
  fs.writeFileSync(stylesPath, updated);
}

function ensureV33Styles(stylesPath: string) {
  if (fs.existsSync(stylesPath)) {
    const existing = fs.readFileSync(stylesPath, "utf8");
    if (existing.includes(STYLE_ITEM)) {
      return;
    }
  }

  const contents = [
    "<resources>",
    "  <style name=\"AppTheme\">",
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
