const fs = require('fs');
const path = require('path');
const { IOSConfig, withInfoPlist, withXcodeProject } = require('expo/config-plugins');

/**
 * Raccourci Siri natif « Facture INVEQ » (App Intents, iOS 16+).
 *
 * Avant, la phrase ne marchait que si l'utilisateur fabriquait lui-même un
 * raccourci dans l'app Raccourcis. Ce plugin ajoute `InveqShortcuts.swift` à
 * la cible de l'app : iOS propose alors « Dis Siri, facture INVEQ » dès
 * l'installation, sans réglage.
 *
 * Les phrases Siri sont écrites en français : la langue de développement du
 * projet passe donc en français, pour qu'iOS les associe à Siri en français.
 */
const SWIFT_FILE = 'InveqShortcuts.swift';

function withSiriShortcut(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.CFBundleDevelopmentRegion = 'fr';
    return mod;
  });

  return withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const projectName = IOSConfig.XcodeUtils.getProjectName(mod.modRequest.projectRoot);
    const appDirectory = path.join(mod.modRequest.platformProjectRoot, projectName);

    fs.mkdirSync(appDirectory, { recursive: true });
    fs.copyFileSync(
      path.join(mod.modRequest.projectRoot, 'plugins', 'siri', SWIFT_FILE),
      path.join(appDirectory, SWIFT_FILE),
    );

    const filepath = `${projectName}/${SWIFT_FILE}`;
    if (!project.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName: projectName, project });
    }

    const root = project.getFirstProject().firstProject;
    root.developmentRegion = 'fr';
    const regions = root.knownRegions ?? [];
    if (!regions.includes('fr')) {
      root.knownRegions = [...regions, 'fr'];
    }

    return mod;
  });
}

module.exports = withSiriShortcut;
