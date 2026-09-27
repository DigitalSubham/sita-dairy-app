const { withProjectBuildGradle } = require("@expo/config-plugins");

const PHONEPE_MAVEN_URL =
  "https://phonepe.mycloudrepo.io/public/repositories/phonepe-intentsdk-android";

// react-native-phonepe-pg (used for the native UPI-app-chooser top-up flow,
// see sita-dairy-app CLAUDE.md) ships no Expo config plugin of its own. Its
// Android setup docs require this Maven repo in the *project-level*
// build.gradle's `allprojects { repositories { ... } }` block — this project
// has no checked-in android/ dir (managed/CNG workflow), so that edit has to
// happen here rather than by hand.
const withPhonePeAndroidMaven = (config) =>
  withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        "withPhonePeAndroidMaven: project build.gradle is not Groovy — update this plugin for the Kotlin DSL.",
      );
    }
    if (config.modResults.contents.includes(PHONEPE_MAVEN_URL)) {
      return config;
    }
    if (!/allprojects\s*{\s*repositories\s*{/.test(config.modResults.contents)) {
      throw new Error(
        "withPhonePeAndroidMaven: couldn't find an `allprojects { repositories { ... } }` block to patch in android/build.gradle — the Expo template changed, update this plugin's regex.",
      );
    }
    config.modResults.contents = config.modResults.contents.replace(
      /allprojects\s*{\s*repositories\s*{/,
      (match) => `${match}\n    maven { url '${PHONEPE_MAVEN_URL}' }`,
    );
    return config;
  });

module.exports = withPhonePeAndroidMaven;
