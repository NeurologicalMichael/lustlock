import ManagedSettings
import ManagedSettingsUI
import UIKit

final class ShieldConfigurationExtension: ShieldConfigurationDataSource {
  override func configuration(shielding application: Application) -> ShieldConfiguration {
    courageConfiguration()
  }

  override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
    courageConfiguration()
  }

  override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
    courageConfiguration()
  }

  override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
    courageConfiguration()
  }

  private func courageConfiguration() -> ShieldConfiguration {
    ShieldConfiguration(
      backgroundBlurStyle: .systemMaterialLight,
      backgroundColor: UIColor(red: 1.0, green: 0.97, blue: 0.93, alpha: 1.0),
      icon: UIImage(systemName: "shield.checkered"),
      title: ShieldConfiguration.Label(
        text: "Hold the Line",
        color: UIColor(red: 0.04, green: 0.04, blue: 0.04, alpha: 1.0)
      ),
      subtitle: ShieldConfiguration.Label(
        text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest. - Joshua 1:9",
        color: UIColor(red: 0.18, green: 0.18, blue: 0.18, alpha: 1.0)
      ),
      primaryButtonLabel: ShieldConfiguration.Label(
        text: "Breathe Through This",
        color: .white
      ),
      primaryButtonBackgroundColor: UIColor(red: 0.91, green: 0.46, blue: 0.17, alpha: 1.0),
      secondaryButtonLabel: ShieldConfiguration.Label(
        text: "Freedom Over Impulse",
        color: UIColor(red: 0.91, green: 0.46, blue: 0.17, alpha: 1.0)
      )
    )
  }
}
