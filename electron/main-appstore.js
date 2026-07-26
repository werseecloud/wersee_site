/**
 * Wersee App Store Desktop entrypoint.
 * Reuses the main Electron shell but starts on the App Store download page.
 */

process.env.WERSEE_APP_NAME = 'Wersee App Store';
process.env.WERSEE_START_PATH = '/download';
process.env.WERSEE_REQUIRE_LOGIN = 'false';

require('./main');
