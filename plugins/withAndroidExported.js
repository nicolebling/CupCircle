const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidExported(config) {
  return withAndroidManifest(config, async (config) => {
    const app = config.modResults.manifest.application[0];

    if (app.activity) {
      app.activity.forEach((activity) => {
        if (activity["intent-filter"]) {
          if (!activity.$["android:exported"]) {
            activity.$["android:exported"] = "true"; // or 'false' depending on the case
          }
        }
      });
    }

    return config;
  });
};
