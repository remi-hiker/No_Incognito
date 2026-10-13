# Disable incognito at the browser level

To prevent Chrome from opening incognito windows at all, set the managed Chrome policy **IncognitoModeAvailability** to the integer **1**. The extension cannot set this policy. Administrator access or a device-management system is required for the managed deployment below.

Follow [Google's deployment instructions](https://support.google.com/chrome/a/answer/13130396) for your environment:

| Environment | Setting |
| --- | --- |
| Google Admin console | Devices → Chrome → Settings → Security → Incognito mode → Disallow incognito mode |
| Windows Group Policy | Google → Google Chrome → Incognito mode availability → Enabled → Incognito mode disabled |
| macOS managed configuration profile | In the `com.google.Chrome` preference domain, set `IncognitoModeAvailability` to `<integer>1</integer>` |
| Linux managed policy | Add `{"IncognitoModeAvailability": 1}` to a dedicated JSON policy file under `/etc/opt/chrome/policies/managed/` |

Restart Chrome, open `chrome://policy`, click **Reload policies**, and verify that `IncognitoModeAvailability` has value `1` with status **OK**. Confirm the incognito menu action is unavailable. Do not overwrite unrelated policies.

To undo your change, remove this policy from the same management source, or restore its previous value, and restart Chrome. Consult the device administrator for devices managed by someone else.

The policy affects Chrome in its configured scope; it does not by itself block Guest mode, other browsers, or changes by someone who has administrator access. None of these settings are applied automatically by this repository.
